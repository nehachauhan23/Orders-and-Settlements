"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-10 border-b border-ink-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-xs font-semibold text-white">
                OT
              </span>
              <span className="text-sm font-semibold text-ink-900">Order Tracker</span>
            </Link>
            <nav className="flex items-center gap-1">
              <Link
                href="/dashboard"
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  pathname === "/dashboard"
                    ? "bg-ink-100 text-ink-900"
                    : "text-ink-500 hover:text-ink-900"
                )}
              >
                Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/orders/new">
              <Button size="sm">New order</Button>
            </Link>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm text-ink-500">{user?.name}</span>
            </div>
            <Button size="sm" variant="ghost" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
