import { DashboardSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";

export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const cards = [
    { label: "Pending", value: summary.pending, tone: "text-ink-600" },
    { label: "Partially paid", value: summary.partially_paid, tone: "text-amber-700" },
    { label: "Paid", value: summary.paid, tone: "text-accent-700" },
    { label: "Overdue", value: summary.overdue, tone: "text-danger-600" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{c.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.tone}`}>{c.value}</p>
        </Card>
      ))}
      <Card className="p-4 sm:col-span-1 col-span-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Outstanding</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-900">
          {formatCurrency(summary.totalOutstandingCents)}
        </p>
      </Card>
    </div>
  );
}
