"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { exportOrdersCsv } from "@/lib/api/payments";
import { OrderStatus } from "@/lib/types";

export function ExportControl({ currentFilter }: { currentFilter: OrderStatus | "all" }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setExportError(null);
    setIsExporting(true);
    try {
      await exportOrdersCsv({
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        status: currentFilter === "all" ? undefined : currentFilter,
      });
      setOpen(false);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Unable to export orders.");
    } finally {
      setIsExporting(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Export CSV
      </Button>
    );
  }

  return (
    <div className="absolute right-0 top-full z-10 mt-2 w-72 rounded-xl border border-ink-100 bg-white p-4 shadow-lg">
      <p className="mb-3 text-sm font-medium text-ink-800">Export orders as CSV</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="export-from">From</Label>
          <Input id="export-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="export-to">To</Label>
          <Input id="export-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>
      <p className="mt-2 text-xs text-ink-400">
        Leave both blank to export all orders. Uses the current status filter
        {currentFilter !== "all" ? ` (${currentFilter.replace("_", " ")})` : " (all statuses)"}.
      </p>
      {exportError && <p className="mt-2 text-xs text-danger-600">{exportError}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleExport} disabled={isExporting}>
          {isExporting ? "Exporting…" : "Download CSV"}
        </Button>
      </div>
    </div>
  );
}
