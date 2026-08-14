export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface Order {
  id: string;
  customer: string;
  dueDate: string;
  lineItems: LineItem[];
  totalCents: number;
  totalPaidCents: number;
  amountDueCents: number;
  status: OrderStatus;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  type: "payment" | "refund";
  amountCents: number;
  paymentDate: string;
  note: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  pending: number;
  partially_paid: number;
  paid: number;
  overdue: number;
  totalOutstandingCents: number;
}

export interface DashboardOrder {
  id: string;
  customer: string;
  status: OrderStatus;
  totalCents: number;
  totalPaidCents: number;
  amountDueCents: number;
  dueDate: string;
}

export interface DashboardResponse {
  summary: DashboardSummary;
  orders: DashboardOrder[];
}

export interface ApiErrorShape {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
