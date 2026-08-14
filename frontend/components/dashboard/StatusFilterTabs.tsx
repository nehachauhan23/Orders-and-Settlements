import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Partially paid", value: "partially_paid" },
  { label: "Paid", value: "paid" },
  { label: "Overdue", value: "overdue" },
];

export function StatusFilterTabs({
  value,
  onChange,
}: {
  value: OrderStatus | "all";
  onChange: (status: OrderStatus | "all") => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg bg-ink-100 p-1">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          onClick={() => onChange(f.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === f.value ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
