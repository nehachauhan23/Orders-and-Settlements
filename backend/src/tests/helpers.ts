import request from "supertest";
import { createApp } from "../app";

export const app = createApp();

export async function signupAndLogin(email: string, name = "Test User") {
  const agent = request.agent(app);
  const res = await agent.post("/api/auth/signup").send({
    name,
    email,
    password: "password123",
  });
  return { agent, userId: res.body.user.id };
}

export function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString();
}
