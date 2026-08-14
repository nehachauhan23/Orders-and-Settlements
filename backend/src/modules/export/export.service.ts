import { Order } from "../orders/order.model";
import { deriveOrderStatus } from "../orders/order.status";
import { OrderStatus } from "../orders/order.model";

export interface ExportOrdersParams {
  userId: string;
  from?: Date;
  to?: Date;
  status?: OrderStatus;
}

const CSV_HEADERS = [
  "Order ID",
  "Customer",
  "Status",
  "Due Date",
  "Order Total",
  "Amount Paid",
  "Amount Due",
  "Created At",
];

function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function centsToDollarsString(cents: number): string {
  return (cents / 100).toFixed(2);
}

/**
 * Builds the CSV export for a user's orders, optionally scoped to a
 * created-date range and/or a single status. Filtering happens at the
 * database query level (not loaded-then-filtered in memory) since an
 * export is exactly the kind of operation that can reasonably be asked
 * for a wide date range across a large order history.
 *
 * Status shown in the export is re-derived the same way every other read
 * path does (see order.status.ts), so an export always reflects
 * current — not stale — status, including orders that have crossed into
 * "overdue" purely due to the passage of time since they were last
 * written.
 */
export async function buildOrdersCsv(params: ExportOrdersParams): Promise<string> {
  const filter: Record<string, unknown> = { userId: params.userId };

  if (params.from || params.to) {
    const createdAt: Record<string, Date> = {};
    if (params.from) createdAt.$gte = params.from;
    if (params.to) createdAt.$lte = params.to;
    filter.createdAt = createdAt;
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 });

  const rows = orders
    .map((order) => {
      const status = deriveOrderStatus({
        totalCents: order.totalCents,
        totalPaidCents: order.totalPaidCents,
        dueDate: order.dueDate,
      });
      return { order, status };
    })
    // Status filtering happens after derivation (not as a DB query filter)
    // because "overdue" is not always what's currently stored — filtering
    // in the query could miss orders that are overdue right now but
    // haven't been re-saved since crossing their due date.
    .filter(({ status }) => !params.status || status === params.status);

  const lines = [CSV_HEADERS.map(csvField).join(",")];

  for (const { order, status } of rows) {
    lines.push(
      [
        csvField(order._id.toString()),
        csvField(order.customer),
        csvField(status),
        csvField(order.dueDate.toISOString().slice(0, 10)),
        csvField(centsToDollarsString(order.totalCents)),
        csvField(centsToDollarsString(order.totalPaidCents)),
        csvField(centsToDollarsString(order.totalCents - order.totalPaidCents)),
        csvField(order.createdAt.toISOString()),
      ].join(",")
    );
  }

  return lines.join("\r\n") + "\r\n";
}
