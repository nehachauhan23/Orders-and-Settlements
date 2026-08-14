import { describe, it, expect } from "vitest";
import { app, signupAndLogin, futureDate } from "./helpers";
import request from "supertest";

describe("auth", () => {
  it("signs up a new user and sets an auth cookie", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe("ada@example.com");
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("rejects signup with a duplicate email", async () => {
    await signupAndLogin("dupe@example.com");
    const res = await request(app).post("/api/auth/signup").send({
      name: "Someone Else",
      email: "dupe@example.com",
      password: "password123",
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_IN_USE");
  });

  it("rejects login with wrong password", async () => {
    await signupAndLogin("bob@example.com");
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "bob@example.com", password: "wrong-password" });
    expect(res.status).toBe(401);
  });

  it("rejects access to /api/auth/me without a cookie", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("authorization", () => {
  it("prevents a user from accessing another user's order", async () => {
    const { agent: userA } = await signupAndLogin("usera@example.com");
    const { agent: userB } = await signupAndLogin("userb@example.com");

    const createRes = await userA.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }],
    });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.order.id;

    const getRes = await userB.get(`/api/orders/${orderId}`);
    expect(getRes.status).toBe(403);
  });

  it("prevents a user from adding a payment to another user's order", async () => {
    const { agent: userA } = await signupAndLogin("payera@example.com");
    const { agent: userB } = await signupAndLogin("payerb@example.com");

    const createRes = await userA.post("/api/orders").send({
      customer: "Acme Corp",
      dueDate: futureDate(30),
      lineItems: [{ description: "Widget", quantity: 2, unitPriceCents: 50000 }],
    });
    const orderId = createRes.body.order.id;

    const payRes = await userB.post(`/api/orders/${orderId}/payments`).send({
      amountCents: 10000,
      paymentDate: new Date().toISOString(),
    });
    expect(payRes.status).toBe(403);
  });

  it("rejects unauthenticated requests to protected order routes", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(401);
  });
});
