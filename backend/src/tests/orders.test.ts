import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

describe("orders API", () => {
  it("creates an order and recalculates the total server-side", async () => {
    const { agent } = await signupAndLogin("orders1@example.com");

    const res = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [
        { description: "Widget", quantity: 2, unitPriceCents: 50000 },
        { description: "Gadget", quantity: 1, unitPriceCents: 10000 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body.order.totalCents).toBe(110000);
    expect(res.body.order.status).toBe("pending");
  });

  it("ignores a client-supplied totalCents and recalculates from line items", async () => {
    const { agent } = await signupAndLogin("orders2@example.com");

    const res = await agent
      .post("/api/orders")
      .send({
        customer: "Acme Corp",
        dueDate: futureDate(30),
        lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }],
        totalCents: 1, // attempted spoof, should be ignored entirely
      });

    expect(res.status).toBe(201);
    expect(res.body.order.totalCents).toBe(100000);
  });

  it("lists only the current user's orders", async () => {
    const { agent: userA } = await signupAndLogin("list-a@example.com");
    const { agent: userB } = await signupAndLogin("list-b@example.com");

    await userA.post("/api/orders").send({
      customer: "A's customer",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });
    await userB.post("/api/orders").send({
      customer: "B's customer",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });

    const res = await userA.get("/api/orders");
    expect(res.status).toBe(200);
    expect(res.body.orders).toHaveLength(1);
    expect(res.body.orders[0].customer).toBe("A's customer");
  });

  it("updates line items and recalculates the total before any payment", async () => {
    const { agent } = await signupAndLogin("orders3@example.com");
    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 1, unitPriceCents: 10000 }],
    });
    const orderId = createRes.body.order.id;

    const updateRes = await agent.patch(`/api/orders/${orderId}`).send({
      lineItems: [{ description: "Widget", quantity: 3, unitPriceCents: 10000 }],
    });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.order.totalCents).toBe(30000);
  });

  it("locks an order from line-item edits after the first payment", async () => {
    const { agent } = await signupAndLogin("orders4@example.com");
    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }],
    });
    const orderId = createRes.body.order.id;

    await agent
      .post(`/api/orders/${orderId}/payments`)
      .send({ amountCents: 10000, paymentDate: new Date().toISOString() });

    const updateRes = await agent.patch(`/api/orders/${orderId}`).send({
      lineItems: [{ description: "Widget", quantity: 5, unitPriceCents: 50000 }],
    });

    expect(updateRes.status).toBe(409);
    expect(updateRes.body.error.code).toBe("ORDER_LOCKED");
  });

  it("deletes an order with no payments", async () => {
    const { agent } = await signupAndLogin("orders5@example.com");
    const createRes = await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 1, unitPriceCents: 10000 }],
    });
    const orderId = createRes.body.order.id;

    const deleteRes = await agent.delete(`/api/orders/${orderId}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await agent.get(`/api/orders/${orderId}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for a nonexistent order", async () => {
    const { agent } = await signupAndLogin("orders6@example.com");
    const res = await agent.get("/api/orders/000000000000000000000000");
    expect(res.status).toBe(404);
  });
});
