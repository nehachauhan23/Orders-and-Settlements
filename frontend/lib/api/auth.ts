import { apiRequest } from "./client";
import { User } from "@/lib/types";

export function signup(input: { name: string; email: string; password: string }) {
  return apiRequest<{ user: User }>("/api/auth/signup", { method: "POST", body: input });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<{ user: User }>("/api/auth/login", { method: "POST", body: input });
}

export function logout() {
  return apiRequest<void>("/api/auth/logout", { method: "POST" });
}

export function me() {
  return apiRequest<{ user: User }>("/api/auth/me");
}
