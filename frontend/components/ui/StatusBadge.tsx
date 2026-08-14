import { OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const STATUS_CONFIG: Record<OrderStatus, { label: string; classes: string }> = {
  pending: { label: "Pending", classes: "bg-ink-100 text-ink-600" },
  partially_paid: { label: "Partially paid", classes: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", classes: "bg-accent-100 text-accent-800" },
  overdue: { label: "Overdue", classes: "bg-danger-50 text-danger-700" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide",
        config.classes
      )}
    >
      {config.label}
    </span>
  );
}
