import { IOrder } from "./order.model";

export function toOrderDTO(order: IOrder) {
  return {
    id: order._id.toString(),
    customer: order.customer,
    dueDate: order.dueDate,
    lineItems: order.lineItems.map((item) => ({
      id: item._id?.toString(),
      description: item.description,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      subtotalCents: item.subtotalCents,
    })),
    totalCents: order.totalCents,
    totalPaidCents: order.totalPaidCents,
    amountDueCents: order.totalCents - order.totalPaidCents,
    status: order.status,
    isLocked: order.isLocked,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}
