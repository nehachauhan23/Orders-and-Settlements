import { apiRequest } from "./client";
import { Payment, DashboardResponse, OrderStatus } from "@/lib/types";

export interface CreatePaymentInput {
  amountCents: number;
  paymentDate: string;
  note?: string;
}


export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createPayment(orderId: string, input: CreatePaymentInput, idempotencyKey: string) {
  return apiRequest<{ payment: Payment }>(`/api/orders/${orderId}/payments`, {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export interface CreateRefundInput {
  amountCents: number;
  paymentDate: string;
  note?: string;
}

export function createRefund(orderId: string, input: CreateRefundInput, idempotencyKey: string) {
  return apiRequest<{ payment: Payment }>(`/api/orders/${orderId}/refunds`, {
    method: "POST",
    body: input,
    headers: { "Idempotency-Key": idempotencyKey },
  });
}

export function listPayments(orderId: string) {
  return apiRequest<{ payments: Payment[] }>(`/api/orders/${orderId}/payments`);
}

export function getDashboard(status?: OrderStatus) {
  const qs = status ? `?status=${status}` : "";
  return apiRequest<DashboardResponse>(`/api/dashboard${qs}`);
}

export interface ExportOrdersParams {
  from?: string;
  to?: string;
  status?: OrderStatus;
}

export async function exportOrdersCsv(params: ExportOrdersParams): Promise<void> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const qs = new URLSearchParams();
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);
  if (params.status) qs.set("status", params.status);

  const res = await fetch(`${API_BASE_URL}/api/exports/orders?${qs.toString()}`, {
    credentials: "include",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || "Unable to export orders.");
  }

  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || "orders-export.csv";

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
