import { OrderStatus } from "./order.model";

export function deriveOrderStatus(params: {
  totalCents: number;
  totalPaidCents: number;
  dueDate: Date;
  now?: Date;
}): OrderStatus {
  const { totalCents, totalPaidCents, dueDate, now = new Date() } = params;

  if (totalPaidCents >= totalCents) {
    return "paid";
  }

  if (dueDate.getTime() < now.getTime()) {
    return "overdue";
  }

  if (totalPaidCents > 0) {
    return "partially_paid";
  }

  return "pending";
}
