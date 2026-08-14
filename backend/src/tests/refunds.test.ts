import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

async function createOrder(agent: any, quantity = 2, unitPriceCents = 50000) {
  const res = await agent.post("/api/orders").send({
    customer: "Acme Corp",
    dueDate: futureDate(30),
    lineItems: [{ description: "Widget", quantity, unitPriceCents }],
  });
  return res.body.order;
}

describe("refunds API", () => {
  it("records a refund and reduces the order's paid total", async () => {
    const { agent } = await signupAndLogin("refund1@example.com");
    const order = await createOrder(agent); // total = $1000

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 100000, paymentDate: new Date().toISOString() }); // paid in full

    const refundRes = await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 30000, paymentDate: new Date().toISOString(), note: "Partial refund" });

    expect(refundRes.status).toBe(201);
    expect(refundRes.body.payment.type).toBe("refund");

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(70000);
    expect(getRes.body.order.amountDueCents).toBe(30000);
  });

  it("drops a fully paid order back to partially_paid after a partial refund", async () => {
    const { agent } = await signupAndLogin("refund2@example.com");
    const order = await createOrder(agent, 1, 50000); // total = $500

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    let getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.status).toBe("paid");

    await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 20000, paymentDate: new Date().toISOString() });

    getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.status).toBe("partially_paid");
  });

  it("drops an order back to pending when refunded down to zero paid", async () => {
    const { agent } = await signupAndLogin("refund3@example.com");
    const order = await createOrder(agent, 1, 50000);

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.status).toBe("pending");
    expect(getRes.body.order.totalPaidCents).toBe(0);
  });

  it("rejects a refund larger than the amount actually paid", async () => {
    const { agent } = await signupAndLogin("refund4@example.com");
    const order = await createOrder(agent); // total = $1000

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 40000, paymentDate: new Date().toISOString() }); // $400 paid

    const refundRes = await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 40001, paymentDate: new Date().toISOString() });

    expect(refundRes.status).toBe(409);
    expect(refundRes.body.error.code).toBe("REFUND_EXCEEDS_PAID");

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(40000); // unchanged
  });

  it("rejects a refund against an order with no payments", async () => {
    const { agent } = await signupAndLogin("refund5@example.com");
    const order = await createOrder(agent);

    const refundRes = await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 100, paymentDate: new Date().toISOString() });

    expect(refundRes.status).toBe(409);
  });

  it("does not unlock an order's line items after a full refund", async () => {
    const { agent } = await signupAndLogin("refund6@example.com");
    const order = await createOrder(agent, 1, 50000);

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });
    await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    const updateRes = await agent
      .patch(`/api/orders/${order.id}`)
      .send({ lineItems: [{ description: "Widget", quantity: 5, unitPriceCents: 50000 }] });

    expect(updateRes.status).toBe(409);
    expect(updateRes.body.error.code).toBe("ORDER_LOCKED");
  });

  it("prevents a user from refunding another user's order", async () => {
    const { agent: userA } = await signupAndLogin("refunda@example.com");
    const { agent: userB } = await signupAndLogin("refundb@example.com");
    const order = await createOrder(userA, 1, 50000);
    await userA
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    const refundRes = await userB
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 1000, paymentDate: new Date().toISOString() });

    expect(refundRes.status).toBe(403);
  });

  it("respects Idempotency-Key on refunds, same as payments", async () => {
    const { agent } = await signupAndLogin("refund7@example.com");
    const order = await createOrder(agent, 1, 50000);
    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    const key = "refund-retry-key";
    const body = { amountCents: 10000, paymentDate: new Date().toISOString() };

    const first = await agent.post(`/api/orders/${order.id}/refunds`).set("Idempotency-Key", key).send(body);
    const retry = await agent.post(`/api/orders/${order.id}/refunds`).set("Idempotency-Key", key).send(body);

    expect(first.status).toBe(201);
    expect(retry.body.payment.id).toBe(first.body.payment.id);

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(40000); // only refunded once
  });

  it("lists both payments and refunds in payment history", async () => {
    const { agent } = await signupAndLogin("refund8@example.com");
    const order = await createOrder(agent, 1, 50000);
    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });
    await agent
      .post(`/api/orders/${order.id}/refunds`)
      .send({ amountCents: 10000, paymentDate: new Date().toISOString() });

    const res = await agent.get(`/api/orders/${order.id}/payments`);
    const types = res.body.payments.map((p: any) => p.type).sort();
    expect(types).toEqual(["payment", "refund"]);
  });
});
