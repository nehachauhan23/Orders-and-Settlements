import { describe, it, expect } from "vitest";
import {
  calculateLineSubtotalCents,
  calculateOrderTotalCents,
  formatCents,
} from "../utils/money";

describe("order calculations", () => {
  it("calculates a single line item subtotal", () => {
    expect(calculateLineSubtotalCents(2, 50000)).toBe(100000);
  });

  it("calculates the total across multiple line items", () => {
    const total = calculateOrderTotalCents([
      { quantity: 2, unitPriceCents: 50000 },
      { quantity: 1, unitPriceCents: 25000 },
    ]);
    expect(total).toBe(125000);
  });

  it("handles quantity multiplication correctly", () => {
    expect(calculateLineSubtotalCents(5, 199)).toBe(995);
  });

  it("allows zero price line items", () => {
    expect(calculateLineSubtotalCents(3, 0)).toBe(0);
  });

  it("rejects invalid quantity", () => {
    expect(() => calculateLineSubtotalCents(0, 100)).toThrow();
    expect(() => calculateLineSubtotalCents(-1, 100)).toThrow();
    expect(() => calculateLineSubtotalCents(1.5, 100)).toThrow();
  });

  it("rejects negative unit price", () => {
    expect(() => calculateLineSubtotalCents(1, -100)).toThrow();
  });

  it("formats cents as currency", () => {
    expect(formatCents(100000)).toBe("$1,000.00");
    expect(formatCents(40000)).toBe("$400.00");
    expect(formatCents(99)).toBe("$0.99");
  });
});
