import { describe, it, expect } from "vitest";
import { signupAndLogin, futureDate } from "./helpers";

describe("CSV export", () => {
  it("exports the user's orders as CSV with a header row", async () => {
    const { agent } = await signupAndLogin("export1@example.com");
    await agent.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(10),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }],
    });

    const res = await agent.get("/api/exports/orders");

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("attachment");

    const lines = res.text.trim().split("\r\n");
    expect(lines[0]).toBe(
      "Order ID,Customer,Status,Due Date,Order Total,Amount Paid,Amount Due,Created At"
    );
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Acme Corp");
    expect(lines[1]).toContain("1000.00");
  });

  it("only exports the current user's orders", async () => {
    const { agent: userA } = await signupAndLogin("exporta@example.com");
    const { agent: userB } = await signupAndLogin("exportb@example.com");

    await userA.post("/api/orders").send({
      customer: "A's customer",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });

    const res = await userB.get("/api/exports/orders");
    const lines = res.text.trim().split("\r\n");
    expect(lines).toHaveLength(1); // header only
  });

  it("filters by status", async () => {
    const { agent } = await signupAndLogin("export2@example.com");
    const pending = await agent.post("/api/orders").send({
      customer: "Pending Co",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });
    const paidOrder = await agent.post("/api/orders").send({
      customer: "Paid Co",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });
    await agent
      .post(`/api/orders/${paidOrder.body.order.id}/payments`)
      .send({ amountCents: 1000, paymentDate: new Date().toISOString() });

    const res = await agent.get("/api/exports/orders?status=paid");
    const lines = res.text.trim().split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("Paid Co");
    void pending;
  });

  it("filters by created-date range", async () => {
    const { agent } = await signupAndLogin("export3@example.com");
    await agent.post("/api/orders").send({
      customer: "In Range",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const inRangeRes = await agent.get(
      `/api/exports/orders?from=${yesterday.toISOString()}&to=${tomorrow.toISOString()}`
    );
    expect(inRangeRes.text.trim().split("\r\n")).toHaveLength(2);

    const outOfRangeRes = await agent.get(
      `/api/exports/orders?from=${futureDate(5)}&to=${futureDate(10)}`
    );
    expect(outOfRangeRes.text.trim().split("\r\n")).toHaveLength(1); // header only
  });

  it("rejects a from date after the to date", async () => {
    const { agent } = await signupAndLogin("export4@example.com");
    const res = await agent.get(
      `/api/exports/orders?from=${futureDate(10)}&to=${futureDate(1)}`
    );
    expect(res.status).toBe(400);
  });

  it("escapes commas embedded in a customer name", async () => {
    const { agent } = await signupAndLogin("export5@example.com");
    await agent.post("/api/orders").send({
      customer: "Acme, Inc.",
      dueDate: futureDate(10),
      lineItems: [{ description: "Item", quantity: 1, unitPriceCents: 1000 }],
    });

    const res = await agent.get("/api/exports/orders");
    const lines = res.text.trim().split("\r\n");
    expect(lines[1]).toContain('"Acme, Inc."');
  });

  it("requires authentication", async () => {
    const request = (await import("supertest")).default;
    const { app } = await import("./helpers");
    const res = await request(app).get("/api/exports/orders");
    expect(res.status).toBe(401);
  });
});
