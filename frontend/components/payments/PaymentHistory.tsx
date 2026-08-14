import { Payment } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { EmptyState } from "@/components/ui/Card";

export function PaymentHistory({ payments }: { payments: Payment[] }) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title="No payments yet"
        description="Payments recorded against this order will show up here."
      />
    );
  }

  return (
    <ul className="divide-y divide-ink-100">
      {payments.map((payment) => {
        const isRefund = payment.type === "refund";
        return (
          <li key={payment.id} className="flex items-start justify-between py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className={`text-sm font-medium ${isRefund ? "text-danger-600" : "text-ink-900"}`}>
                  {isRefund ? "−" : ""}
                  {formatCurrency(payment.amountCents)}
                </p>
                {isRefund && (
                  <span className="rounded-full bg-danger-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-danger-700">
                    Refund
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-400">{formatDate(payment.paymentDate)}</p>
              {payment.note && <p className="mt-1 text-xs text-ink-500">{payment.note}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
