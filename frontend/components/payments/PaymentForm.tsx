"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { paymentFormSchema, PaymentFormValues } from "@/lib/utils/schemas";
import { Input, Label, FieldError, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCreatePayment } from "@/lib/hooks/usePayments";
import { generateIdempotencyKey } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { Order } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PaymentForm({ order }: { order: Order }) {
  const createPayment = useCreatePayment(order.id);
  const [formError, setFormError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => generateIdempotencyKey());

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: undefined, paymentDate: todayInput(), note: "" },
  });

  const isPending = isSubmitting || createPayment.isPending;

  async function onSubmit(values: PaymentFormValues) {
    setFormError(null);
    try {
      await createPayment.mutateAsync({
        input: {
          amountCents: Math.round(values.amount * 100),
          paymentDate: new Date(values.paymentDate).toISOString(),
          note: values.note || undefined,
        },
        idempotencyKey,
      });
      reset({ amount: undefined, paymentDate: todayInput(), note: "" });
      // A new key for the next distinct payment; this submission's key
      // has done its job and must not be reused for a different payment.
      setIdempotencyKey(generateIdempotencyKey());
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to record the payment. Try again.");
    }
  }

  if (order.amountDueCents <= 0) {
    return (
      <p className="rounded-lg bg-accent-50 px-4 py-3 text-sm text-accent-800">
        This order is fully paid. No balance remains.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <p className="text-xs text-ink-400">
        Remaining balance: <span className="font-medium text-ink-700">{formatCurrency(order.amountDueCents)}</span>
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" min={0.01} step={0.01} placeholder="0.00" {...register("amount")} />
          <FieldError>{errors.amount?.message}</FieldError>
        </div>
        <div>
          <Label htmlFor="paymentDate">Payment date</Label>
          <Input id="paymentDate" type="date" {...register("paymentDate")} />
          <FieldError>{errors.paymentDate?.message}</FieldError>
        </div>
      </div>
      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea id="note" rows={2} placeholder="e.g. Wire transfer, ref #4521" {...register("note")} />
        <FieldError>{errors.note?.message}</FieldError>
      </div>

      {formError && <p className="text-sm text-danger-600">{formError}</p>}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Recording payment…" : "Record payment"}
      </Button>
    </form>
  );
}
