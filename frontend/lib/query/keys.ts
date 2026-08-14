export const queryKeys = {
  me: ["auth", "me"] as const,
  orders: (status?: string) => ["orders", status ?? "all"] as const,
  order: (id: string) => ["orders", id] as const,
  payments: (orderId: string) => ["payments", orderId] as const,
  dashboard: (status?: string) => ["dashboard", status ?? "all"] as const,
};
