"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ConfirmDeleteButton({
  onConfirm,
  disabled,
  label = "Delete order",
}: {
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
  label?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-ink-500">Delete this order?</span>
        <Button size="sm" variant="danger" onClick={onConfirm} disabled={disabled}>
          Yes, delete
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="secondary" onClick={() => setConfirming(true)} disabled={disabled}>
      {label}
    </Button>
  );
}
