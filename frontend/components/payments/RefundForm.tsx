"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refundFormSchema, RefundFormValues } from "@/lib/utils/schemas";
import { Input, Label, FieldError, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreateRefund } from "@/lib/hooks/usePayments";
import { generateIdempotencyKey } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RefundForm({ order }: { order: Order }) {
  const createRefund = useCreateRefund(order.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { amount: undefined, paymentDate: todayInput(), note: "" },
  });

  const isPending = isSubmitting || createRefund.isPending;

  async function onSubmit(values: RefundFormValues) {
    setFormError(null);
    try {
      await createRefund.mutateAsync({
        input: {
          amountCents: Math.round(values.amount * 100),
          paymentDate: new Date(values.paymentDate).toISOString(),
          note: values.note || undefined,
        },
        idempotencyKey,
      });
      reset({ amount: undefined, paymentDate: todayInput(), note: "" });
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to record the refund. Try again.");
    }
  }

  if (order.totalPaidCents <= 0) {
    return (
      <p className="rounded-lg bg-ink-50 px-4 py-3 text-sm text-ink-500">
        No payments have been recorded against this order yet, so there&apos;s nothing to refund.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-xs text-ink-400">
        Amount paid so far: <span className="font-medium text-ink-700">{formatCurrency(order.totalPaidCents)}</span>
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="refund-amount">Refund amount</Label>
          <Input
            id="refund-amount"
            type="number"
            min={0.01}
            step={0.01}
            placeholder="0.00"
            {...register("amount")}
          />
          <FieldError>{errors.amount?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="refund-date">Refund date</Label>
          <Input id="refund-date" type="date" {...register("paymentDate")} />
          <FieldError>{errors.paymentDate?.message}</FieldError>
        </div>
      </div>
      <div>
        <Label htmlFor="refund-note">Reason (optional)</Label>
        <Textarea id="refund-note" rows={2} placeholder="e.g. Damaged goods, partial cancellation" {...register("note")} />
        <FieldError>{errors.note?.message}</FieldError>
      </div>

      {formError && <p className="text-sm text-danger-600">{formError}</p>}

      <Button type="submit" variant="danger" disabled={isPending} className="w-full">
        {isPending ? "Recording refund…" : "Issue refund"}
      </Button>
    </form>
  );
}
