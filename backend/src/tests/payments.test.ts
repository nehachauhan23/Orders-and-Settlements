import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

async function createOrder(agent: any, totalUnits = 2, unitPriceCents = 50000) {
  const res = await agent.post("/api/orders").send({
    customer: "Acme Corp",
    dueDate: futureDate(30),
    lineItems: [{ description: "Widget", quantity: totalUnits, unitPriceCents }],
  });
  return res.body.order;
}

describe("payments API", () => {
  it("records a valid partial payment", async () => {
    const { agent } = await signupAndLogin("pay1@example.com");
    const order = await createOrder(agent); // total = $1000

    const res = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 40000, paymentDate: new Date().toISOString() });

    expect(res.status).toBe(201);

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(40000);
    expect(getRes.body.order.amountDueCents).toBe(60000);
    expect(getRes.body.order.status).toBe("partially_paid");
  });

  it("records a full payment and marks the order paid", async () => {
    const { agent } = await signupAndLogin("pay2@example.com");
    const order = await createOrder(agent, 1, 50000); // total = $500

    const res = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 50000, paymentDate: new Date().toISOString() });

    expect(res.status).toBe(201);

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.status).toBe("paid");
    expect(getRes.body.order.amountDueCents).toBe(0);
  });

  it("supports multiple partial payments accumulating to the full amount", async () => {
    const { agent } = await signupAndLogin("pay3@example.com");
    const order = await createOrder(agent); // total = $1000

    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 40000, paymentDate: new Date().toISOString() });
    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 60000, paymentDate: new Date().toISOString() });

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(100000);
    expect(getRes.body.order.status).toBe("paid");

    const paymentsRes = await agent.get(`/api/orders/${order.id}/payments`);
    expect(paymentsRes.body.payments).toHaveLength(2);
  });

  it("rejects a payment that would overpay the order (full assignment scenario)", async () => {
    const { agent } = await signupAndLogin("pay4@example.com");
    const order = await createOrder(agent); // total = $1000

    const p1 = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 40000, paymentDate: new Date().toISOString() });
    expect(p1.status).toBe(201);

    const p2 = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 60000, paymentDate: new Date().toISOString() });
    expect(p2.status).toBe(201);

    // order is now fully paid at $1000; attempt another $1 payment
    const p3 = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 100, paymentDate: new Date().toISOString() });

    expect(p3.status).toBe(409);
    expect(p3.body.error.code).toBe("PAYMENT_EXCEEDS_BALANCE");

    // existing payments must remain unchanged
    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(100000);
    expect(getRes.body.order.status).toBe("paid");
  });

  it("rejects a single payment larger than the remaining balance", async () => {
    const { agent } = await signupAndLogin("pay5@example.com");
    const order = await createOrder(agent, 2, 50000); // total = $1000
    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 60000, paymentDate: new Date().toISOString() }); // $600 paid

    const res = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 40100, paymentDate: new Date().toISOString() }); // $401 > $400 remaining

    expect(res.status).toBe(409);
    expect(res.body.error.message).toContain("$400.00");
  });

  it("validates payment amount must be greater than zero", async () => {
    const { agent } = await signupAndLogin("pay6@example.com");
    const order = await createOrder(agent);

    const res = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 0, paymentDate: new Date().toISOString() });

    expect(res.status).toBe(400);
  });

  it("validates payment date is required and valid", async () => {
    const { agent } = await signupAndLogin("pay7@example.com");
    const order = await createOrder(agent);

    const res = await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 1000, paymentDate: "not-a-date" });

    expect(res.status).toBe(400);
  });
});
