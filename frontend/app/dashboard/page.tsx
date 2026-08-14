"use client";

import { useState } from "react";
import Link from "next/link";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { useDashboard } from "@/lib/hooks/useDashboard";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { StatusFilterTabs } from "@/components/dashboard/StatusFilterTabs";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { EmptyState, ErrorState, LoadingRows } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ExportControl } from "@/components/dashboard/ExportControl";
import { OrderStatus } from "@/lib/types";

export default function DashboardPage() {
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const { data, isLoading, isError, error } = useDashboard(filter === "all" ? undefined : filter);

  return (
    <RequireAuth>
      <AppShell>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
            <p className="mt-1 text-sm text-ink-400">
              Every order, its status, and what&apos;s still owed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <ExportControl currentFilter={filter} />
            </div>
            <Link href="/orders/new">
              <Button>New order</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-ink-100" />
              ))}
            </div>
            <LoadingRows rows={5} />
          </div>
        )}

        {isError && <ErrorState message={error instanceof Error ? error.message : "Failed to load dashboard."} />}

        {data && (
          <div className="space-y-6">
            <SummaryCards summary={data.summary} />

            <div className="flex items-center justify-between">
              <StatusFilterTabs value={filter} onChange={setFilter} />
            </div>

            {data.orders.length === 0 ? (
              <EmptyState
                title={filter === "all" ? "No orders yet" : "No orders match this filter"}
                description={
                  filter === "all"
                    ? "Create your first order to start tracking payments."
                    : "Try a different status, or create a new order."
                }
                action={
                  <Link href="/orders/new">
                    <Button size="sm">New order</Button>
                  </Link>
                }
              />
            ) : (
              <OrdersTable orders={data.orders} />
            )}
          </div>
        )}
      </AppShell>
    </RequireAuth>
  );
}
