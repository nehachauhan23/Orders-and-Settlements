import Link from "next/link";
import { DashboardOrder } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { StatusBadge } from "@/components/ui/StatusBadge";

export function OrdersTable({ orders }: { orders: DashboardOrder[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400">
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3">Status</th>
            <th className="px-5 py-3 text-right">Order total</th>
            <th className="px-5 py-3 text-right">Amount paid</th>
            <th className="px-5 py-3 text-right">Amount due</th>
            <th className="px-5 py-3">Due date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/70">
              <td className="px-5 py-3.5">
                <Link href={`/orders/${order.id}`} className="font-medium text-ink-900 hover:underline">
                  {order.customer}
                </Link>
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums text-ink-700">
                {formatCurrency(order.totalCents)}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums text-ink-700">
                {formatCurrency(order.totalPaidCents)}
              </td>
              <td className="px-5 py-3.5 text-right tabular-nums font-medium text-ink-900">
                {formatCurrency(order.amountDueCents)}
              </td>
              <td className="px-5 py-3.5 text-ink-500">{formatDate(order.dueDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
