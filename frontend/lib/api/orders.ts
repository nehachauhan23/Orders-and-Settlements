import { apiRequest } from "./client";
import { Order, OrderStatus } from "@/lib/types";

export interface LineItemInput {
  description: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateOrderInput {
  customer: string;
  dueDate: string;
  lineItems: LineItemInput[];
}

export interface UpdateOrderInput {
  customer?: string;
  dueDate?: string;
  lineItems?: LineItemInput[];
}

export function createOrder(input: CreateOrderInput) {
  return apiRequest<{ order: Order }>("/api/orders", { method: "POST", body: input });
}

export function listOrders(status?: OrderStatus) {
  const qs = status ? `?status=${status}` : "";
  return apiRequest<{ orders: Order[] }>(`/api/orders${qs}`);
}

export function getOrder(id: string) {
  return apiRequest<{ order: Order }>(`/api/orders/${id}`);
}

export function updateOrder(id: string, input: UpdateOrderInput) {
  return apiRequest<{ order: Order }>(`/api/orders/${id}`, { method: "PATCH", body: input });
}

export function deleteOrder(id: string) {
  return apiRequest<void>(`/api/orders/${id}`, { method: "DELETE" });
}
