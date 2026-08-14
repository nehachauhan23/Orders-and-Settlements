import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

describe("idempotency", () => {
  it("does not create a duplicate payment when the same Idempotency-Key is reused", async () => {
    const { agent } = await signupAndLogin("idem1@example.com");

    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }], // $1000
    });
    const order = createRes.body.order;

    const key = "retry-key-123";
    const body = { amountCents: 40000, paymentDate: new Date().toISOString() };

    const first = await agent
      .post(`/api/orders/${order.id}/payments`)
      .set("Idempotency-Key", key)
      .send(body);
    expect(first.status).toBe(201);

    const retry = await agent
      .post(`/api/orders/${order.id}/payments`)
      .set("Idempotency-Key", key)
      .send(body);
    expect(retry.status).toBe(201);
    expect(retry.body.payment.id).toBe(first.body.payment.id);

    const paymentsRes = await agent.get(`/api/orders/${order.id}/payments`);
    expect(paymentsRes.body.payments).toHaveLength(1);

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(40000);
  });

  it("treats requests without an idempotency key as independent payments", async () => {
    const { agent } = await signupAndLogin("idem2@example.com");

    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 4, unitPriceCents: 50000 }], // $2000
    });
    const order = createRes.body.order;

    const body = { amountCents: 40000, paymentDate: new Date().toISOString() };
    await agent.post(`/api/orders/${order.id}/payments`).send(body);
    await agent.post(`/api/orders/${order.id}/payments`).send(body);

    const paymentsRes = await agent.get(`/api/orders/${order.id}/payments`);
    expect(paymentsRes.body.payments).toHaveLength(2);
  });
});
