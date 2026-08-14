import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

describe("concurrency", () => {
  it("does not allow two simultaneous payments to overpay an order", async () => {
    const { agent } = await signupAndLogin("concurrency1@example.com");

    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }], // $1000
    });
    const order = createRes.body.order;

    // Pre-fund $600 so $400 remains.
    await agent
      .post(`/api/orders/${order.id}/payments`)
      .send({ amountCents: 60000, paymentDate: new Date().toISOString() });

    // Fire two concurrent $400 payment requests. At most one may succeed.
    const [resA, resB] = await Promise.all([
      agent
        .post(`/api/orders/${order.id}/payments`)
        .send({ amountCents: 40000, paymentDate: new Date().toISOString() }),
      agent
        .post(`/api/orders/${order.id}/payments`)
        .send({ amountCents: 40000, paymentDate: new Date().toISOString() }),
    ]);

    const statuses = [resA.status, resB.status].sort();
    // Exactly one should succeed (201) and one should be rejected (409).
    expect(statuses).toEqual([201, 409]);

    const getRes = await agent.get(`/api/orders/${order.id}`);
    expect(getRes.body.order.totalPaidCents).toBe(100000); // $1000, never $1400
    expect(getRes.body.order.status).toBe("paid");
  }, 30000);
});
