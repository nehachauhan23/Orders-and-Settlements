"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card, ErrorState, LoadingRows } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LineItemsTable } from "@/components/orders/LineItemsTable";
import { PaymentForm } from "@/components/payments/PaymentForm";
import { RefundForm } from "@/components/payments/RefundForm";
import { PaymentHistory } from "@/components/payments/PaymentHistory";
import { ConfirmDeleteButton } from "@/components/orders/ConfirmDeleteButton";
import { useOrder, useDeleteOrder } from "@/lib/hooks/useOrders";
import { usePayments } from "@/lib/hooks/usePayments";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params.id;
  const router = useRouter();

  const { data: orderData, isLoading, isError, error } = useOrder(orderId);
  const { data: paymentsData, isLoading: paymentsLoading } = usePayments(orderId);
  const deleteOrder = useDeleteOrder();
  const [activeTab, setActiveTab] = useState<"payment" | "refund">("payment");

  async function handleDelete() {
    await deleteOrder.mutateAsync(orderId);
    router.push("/dashboard");
  }

  return (
    <RequireAuth>
      <AppShell>
        <Link href="/dashboard" className="text-sm text-ink-400 hover:text-ink-700">
          ← Back to dashboard
        </Link>

        {isLoading && (
          <div className="mt-4">
            <LoadingRows rows={6} />
          </div>
        )}

        {isError && (
          <div className="mt-4">
            <ErrorState message={error instanceof Error ? error.message : "Failed to load order."} />
          </div>
        )}

        {orderData && (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-ink-900">{orderData.order.customer}</h1>
                    <p className="mt-1 text-sm text-ink-400">Due {formatDate(orderData.order.dueDate)}</p>
                  </div>
                  <StatusBadge status={orderData.order.status} />
                </div>

                <div className="mt-6 grid grid-cols-3 gap-4 rounded-xl bg-ink-50 p-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Order total</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
                      {formatCurrency(orderData.order.totalCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Amount paid</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-accent-700">
                      {formatCurrency(orderData.order.totalPaidCents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-ink-400">Amount due</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
                      {formatCurrency(orderData.order.amountDueCents)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <h2 className="mb-2 text-sm font-medium text-ink-700">Line items</h2>
                  <LineItemsTable lineItems={orderData.order.lineItems} />
                  {orderData.order.isLocked && (
                    <p className="mt-3 text-xs text-ink-400">
                      This order has payments recorded, so its line items are locked.
                    </p>
                  )}
                </div>

                {!orderData.order.isLocked && (
                  <div className="mt-6 flex justify-end">
                    <ConfirmDeleteButton onConfirm={handleDelete} disabled={deleteOrder.isPending} />
                  </div>
                )}
              </Card>

              <Card className="p-6">
                <h2 className="mb-3 text-sm font-medium text-ink-700">Payment history</h2>
                {paymentsLoading ? (
                  <LoadingRows rows={2} />
                ) : (
                  <PaymentHistory payments={paymentsData?.payments ?? []} />
                )}
              </Card>
            </div>

            <div>
              <Card className="p-6">
                <div className="mb-3 flex gap-1 rounded-lg bg-ink-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveTab("payment")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      activeTab === "payment" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
                    )}
                  >
                    Record payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("refund")}
                    className={cn(
                      "flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      activeTab === "refund" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
                    )}
                  >
                    Issue refund
                  </button>
                </div>
                {activeTab === "payment" ? (
                  <PaymentForm order={orderData.order} />
                ) : (
                  <RefundForm order={orderData.order} />
                )}
              </Card>
            </div>
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
