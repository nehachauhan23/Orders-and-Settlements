"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/Card";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { orderFormSchema, OrderFormValues } from "@/lib/utils/schemas";
import { useCreateOrder } from "@/lib/hooks/useOrders";
import { ApiError } from "@/lib/api/client";
import { formatCurrency } from "@/lib/utils/format";

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function NewOrderPage() {
  const router = useRouter();
  const createOrder = useCreateOrder();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      customer: "",
      dueDate: todayInput(),
      lineItems: [{ description: "", quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
  const lineItems = watch("lineItems");

  const totalCents = lineItems.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    return sum + Math.round(qty * price * 100);
  }, 0);

  async function onSubmit(values: OrderFormValues) {
    setFormError(null);
    try {
      const { order } = await createOrder.mutateAsync({
        customer: values.customer,
        dueDate: new Date(values.dueDate).toISOString(),
        lineItems: values.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPriceCents: Math.round(item.unitPrice * 100),
        })),
      });
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to create the order. Try again.");
    }
  }

  return (
    <RequireAuth>
      <AppShell>
        <div className="mx-auto max-w-2xl">
          <h1 className="text-xl font-semibold text-ink-900">New order</h1>
          <p className="mt-1 text-sm text-ink-400">Add the customer, due date, and what they&apos;re ordering.</p>

          <Card className="mt-6 p-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Input id="customer" placeholder="Acme Corp" {...register("customer")} />
                  <FieldError>{errors.customer?.message}</FieldError>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due date</Label>
                  <Input id="dueDate" type="date" {...register("dueDate")} />
                  <FieldError>{errors.dueDate?.message}</FieldError>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="mb-0">Line items</Label>
                  <button
                    type="button"
                    onClick={() => append({ description: "", quantity: 1, unitPrice: 0 })}
                    className="text-xs font-medium text-accent-700 hover:underline"
                  >
                    + Add line item
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-12 items-start gap-2">
                      <div className="col-span-6">
                        <Input
                          placeholder="Description"
                          {...register(`lineItems.${index}.description` as const)}
                        />
                        <FieldError>{errors.lineItems?.[index]?.description?.message}</FieldError>
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          min={1}
                          step={1}
                          placeholder="Qty"
                          {...register(`lineItems.${index}.quantity` as const)}
                        />
                        <FieldError>{errors.lineItems?.[index]?.quantity?.message}</FieldError>
                      </div>
                      <div className="col-span-3">
                        <Input
                          type="number"
                          min={0}
                          step={0.01}
                          placeholder="Unit price"
                          {...register(`lineItems.${index}.unitPrice` as const)}
                        />
                        <FieldError>{errors.lineItems?.[index]?.unitPrice?.message}</FieldError>
                      </div>
                      <div className="col-span-1 pt-2">
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            aria-label="Remove line item"
                            className="text-ink-300 hover:text-danger-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <FieldError>{errors.lineItems?.message as string | undefined}</FieldError>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-ink-50 px-4 py-3">
                <span className="text-sm font-medium text-ink-600">Order total</span>
                <span className="text-lg font-semibold tabular-nums text-ink-900">
                  {formatCurrency(totalCents)}
                </span>
              </div>

              {formError && <p className="text-sm text-danger-600">{formError}</p>}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => router.push("/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating…" : "Create order"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </AppShell>
    </RequireAuth>
  );
}
