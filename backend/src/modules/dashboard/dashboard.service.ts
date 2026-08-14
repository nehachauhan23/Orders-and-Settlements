import { Order } from "../orders/order.model";
import { deriveOrderStatus } from "../orders/order.status";

export async function getDashboard(userId: string, statusFilter?: string) {
  const filter: Record<string, unknown> = { userId };

  const allOrders = await Order.find({ userId }).sort({ dueDate: 1 });

  // Refresh date-dependent status (overdue) for accurate summary counts.
  let mutated = false;
  for (const order of allOrders) {
    const fresh = deriveOrderStatus({
      totalCents: order.totalCents,
      totalPaidCents: order.totalPaidCents,
      dueDate: order.dueDate,
    });
    if (fresh !== order.status) {
      order.status = fresh;
      mutated = true;
      await order.save();
    }
  }
  void mutated;

  const summary = {
    pending: 0,
    partially_paid: 0,
    paid: 0,
    overdue: 0,
    totalOutstandingCents: 0,
  };

  for (const order of allOrders) {
    summary[order.status] += 1;
    summary.totalOutstandingCents += order.totalCents - order.totalPaidCents;
  }

  const filtered = statusFilter
    ? allOrders.filter((o) => o.status === statusFilter)
    : allOrders;

  return {
    summary,
    orders: filtered.map((order) => ({
      id: order._id.toString(),
      customer: order.customer,
      status: order.status,
      totalCents: order.totalCents,
      totalPaidCents: order.totalPaidCents,
      amountDueCents: order.totalCents - order.totalPaidCents,
      dueDate: order.dueDate,
    })),
  };
}
