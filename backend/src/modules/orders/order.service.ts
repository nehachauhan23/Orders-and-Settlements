import { Order, IOrder } from "./order.model";
import { CreateOrderInput, UpdateOrderInput, ListOrdersQuery } from "./order.schema";
import { calculateLineSubtotalCents, calculateOrderTotalCents } from "../../utils/money";
import { deriveOrderStatus } from "./order.status";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors";
import { recordAuditEvent } from "../audit/audit.service";

function buildLineItems(input: CreateOrderInput["lineItems"]) {
  return input.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    subtotalCents: calculateLineSubtotalCents(item.quantity, item.unitPriceCents),
  }));
}

export async function createOrder(userId: string, input: CreateOrderInput) {
  const lineItems = buildLineItems(input.lineItems);
  const totalCents = calculateOrderTotalCents(lineItems);

  const order = await Order.create({
    userId,
    customer: input.customer,
    dueDate: input.dueDate,
    lineItems,
    totalCents,
    totalPaidCents: 0,
    status: deriveOrderStatus({ totalCents, totalPaidCents: 0, dueDate: input.dueDate }),
    isLocked: false,
  });

  await recordAuditEvent({
    userId,
    orderId: order._id,
    action: "ORDER_CREATED",
    metadata: { customer: order.customer, totalCents: order.totalCents },
  });

  return order;
}

export async function listOrders(userId: string, query: ListOrdersQuery) {
  const filter: Record<string, unknown> = { userId };
  if (query.status) filter.status = query.status;

  const skip = (query.page - 1) * query.limit;

  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
    Order.countDocuments(filter),
  ]);

  // Status can depend on the current date (overdue), so refresh it for
  // display without necessarily persisting on every read (persisted lazily
  // below only when it has actually changed, to avoid a write on every GET).
  const refreshed = await Promise.all(orders.map((order) => refreshStatusIfNeeded(order)));

  return {
    orders: refreshed,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getOrderById(userId: string, orderId: string): Promise<IOrder> {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found.");
  assertOwnership(order, userId);
  return refreshStatusIfNeeded(order);
}

function assertOwnership(order: IOrder, userId: string) {
  if (order.userId.toString() !== userId) {
    // Deliberately the same NotFoundError shape/message as "doesn't exist"
    // would be even stricter, but a distinct 403 is clearer for API
    // consumers while still not leaking the other user's data.
    throw new ForbiddenError("You do not have access to this order.");
  }
}

/**
 * Re-derives status from authoritative data (relevant for the
 * date-dependent "overdue" transition) and persists the change if it
 * differs from what's stored, logging an ORDER_STATUS_CHANGED audit event.
 */
async function refreshStatusIfNeeded(order: IOrder): Promise<IOrder> {
  const newStatus = deriveOrderStatus({
    totalCents: order.totalCents,
    totalPaidCents: order.totalPaidCents,
    dueDate: order.dueDate,
  });

  if (newStatus !== order.status) {
    const previousStatus = order.status;
    order.status = newStatus;
    await order.save();
    await recordAuditEvent({
      userId: order.userId,
      orderId: order._id,
      action: "ORDER_STATUS_CHANGED",
      metadata: { from: previousStatus, to: newStatus, reason: "due_date_check" },
    });
  }

  return order;
}

export async function updateOrder(userId: string, orderId: string, input: UpdateOrderInput) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found.");
  assertOwnership(order, userId);

  // Business rule: an order becomes read-only after the first payment.
  // This protects the integrity of the total-vs-payments relationship —
  // changing line items after money has been collected against them
  // would silently invalidate recorded payments.
  if (order.isLocked && input.lineItems) {
    throw new ConflictError(
      "ORDER_LOCKED",
      "This order has payments recorded and its line items can no longer be edited."
    );
  }

  if (input.customer !== undefined) order.customer = input.customer;
  if (input.dueDate !== undefined) order.dueDate = input.dueDate;

  if (input.lineItems !== undefined) {
    const lineItems = buildLineItems(input.lineItems);
    order.lineItems = lineItems as IOrder["lineItems"];
    order.totalCents = calculateOrderTotalCents(lineItems);
  }

  order.status = deriveOrderStatus({
    totalCents: order.totalCents,
    totalPaidCents: order.totalPaidCents,
    dueDate: order.dueDate,
  });

  await order.save();

  await recordAuditEvent({
    userId,
    orderId: order._id,
    action: "ORDER_UPDATED",
    metadata: { customer: order.customer, totalCents: order.totalCents },
  });

  return order;
}

export async function deleteOrder(userId: string, orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found.");
  assertOwnership(order, userId);

  if (order.isLocked) {
    throw new ConflictError(
      "ORDER_LOCKED",
      "This order has payments recorded and cannot be deleted."
    );
  }

  await order.deleteOne();

  await recordAuditEvent({
    userId,
    orderId: order._id,
    action: "ORDER_DELETED",
    metadata: { customer: order.customer },
  });
}
