/**
 * All monetary values in this system are stored and calculated as integer
 * minor units (cents). JavaScript floating-point numbers cannot represent
 * currency exactly (0.1 + 0.2 !== 0.3), so floats are never used for money
 * math anywhere in the codebase. Conversion to a decimal/display string only
 * ever happens at the presentation boundary via `formatCents`.
 */

export function isValidCents(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

export function calculateLineSubtotalCents(quantity: number, unitPriceCents: number): number {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("quantity must be an integer >= 1");
  }
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) {
    throw new Error("unitPriceCents must be an integer >= 0");
  }
  return quantity * unitPriceCents;
}

export function calculateOrderTotalCents(
  lineItems: Array<{ quantity: number; unitPriceCents: number }>
): number {
  return lineItems.reduce(
    (sum, item) => sum + calculateLineSubtotalCents(item.quantity, item.unitPriceCents),
    0
  );
}

export function sumPaymentsCents(payments: Array<{ amountCents: number }>): number {
  return payments.reduce((sum, p) => sum + p.amountCents, 0);
}

export function formatCents(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const dollars = Math.floor(abs / 100);
  const remainder = String(abs % 100).padStart(2, "0");
  return `${sign}$${dollars.toLocaleString("en-US")}.${remainder}`;
}
