import { describe, it, expect } from "vitest";
import { deriveOrderStatus } from "../modules/orders/order.status";

const now = new Date("2026-08-10T00:00:00Z");
const future = new Date("2026-09-01T00:00:00Z");
const past = new Date("2026-07-01T00:00:00Z");

describe("order status derivation", () => {
  it("is pending with no payments and a future due date", () => {
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 0, dueDate: future, now })
    ).toBe("pending");
  });

  it("is partially_paid when some but not all is paid", () => {
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 400, dueDate: future, now })
    ).toBe("partially_paid");
  });

  it("is paid when total paid equals total", () => {
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 1000, dueDate: future, now })
    ).toBe("paid");
  });

  it("is overdue when due date has passed and not fully paid", () => {
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 0, dueDate: past, now })
    ).toBe("overdue");
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 400, dueDate: past, now })
    ).toBe("overdue");
  });

  it("prefers paid over overdue: a fully-paid order past its due date is paid, not overdue", () => {
    expect(
      deriveOrderStatus({ totalCents: 1000, totalPaidCents: 1000, dueDate: past, now })
    ).toBe("paid");
  });
});
