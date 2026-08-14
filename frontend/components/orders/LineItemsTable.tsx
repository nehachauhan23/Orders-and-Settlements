import { LineItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

export function LineItemsTable({ lineItems }: { lineItems: LineItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-400">
          <th className="py-2">Description</th>
          <th className="py-2 text-right">Qty</th>
          <th className="py-2 text-right">Unit price</th>
          <th className="py-2 text-right">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        {lineItems.map((item, i) => (
          <tr key={item.id || i} className="border-b border-ink-50 last:border-0">
            <td className="py-2.5 text-ink-800">{item.description}</td>
            <td className="py-2.5 text-right tabular-nums text-ink-600">{item.quantity}</td>
            <td className="py-2.5 text-right tabular-nums text-ink-600">
              {formatCurrency(item.unitPriceCents)}
            </td>
            <td className="py-2.5 text-right tabular-nums font-medium text-ink-900">
              {formatCurrency(item.subtotalCents)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
