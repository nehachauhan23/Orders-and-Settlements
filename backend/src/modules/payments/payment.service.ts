import mongoose from "mongoose";
import { Payment, IPayment } from "./payment.model";
import { Order, IOrder } from "../orders/order.model";
import { CreatePaymentInput, CreateRefundInput } from "./payment.schema";
import { formatCents } from "../../utils/money";
import { ConflictError, ForbiddenError, NotFoundError } from "../../utils/errors";
import { recordAuditEvent } from "../audit/audit.service";

/**
 * Concurrency strategy
 * --------------------
 * Two requests can race to pay (or refund) the same order. Total payments
 * must never exceed the order total, and a refund must never exceed what
 * was actually paid, even under a race.
 *
 * Earlier versions of this file enforced that with a "read the order,
 * check the balance in application code, then write" pattern inside a
 * MongoDB transaction, relying on the transaction's read concern and
 * write-conflict detection for correctness. In practice that turned out
 * to be sensitive to exactly which read concern the transaction used —
 * "snapshot" (the withTransaction default) could read a stale balance
 * relative to a separate, already-committed prior transaction, and
 * "local" produced its own inconsistent results under true concurrent
 * writers. Both are symptoms of the same root issue: splitting "check"
 * and "write" into two steps always leaves a window, however small, for
 * the check to be evaluated against data that's no longer current by the
 * time the write happens.
 *
 * The fix is to not split them. `Order.findOneAndUpdate` below uses a
 * query filter with `$expr` that encodes the balance rule directly
 * ("only apply this update if totalPaidCents + amountCents would not
 * exceed totalCents"), evaluated by MongoDB itself against the
 * document's actual state at the moment of the write — not a separately
 * read snapshot. Single-document writes in MongoDB are always atomic:
 * there is no window between "check" and "write" because they are the
 * same operation. Two concurrent requests both attempting to spend the
 * same last $400 of a balance will have their updates serialized by the
 * storage engine; whichever is applied first changes totalPaidCents, and
 * the second one's `$expr` is evaluated against that new value and
 * correctly fails to match, returning null instead of applying. This is
 * a stronger and simpler guarantee than the read-then-write version and
 * doesn't depend on any particular read concern.
 *
 * The whole operation (the conditional order update, the Payment
 * insert, and the audit log entry) is still wrapped in a transaction —
 * not for the balance guarantee itself, which the atomic update already
 * provides, but so that a payment record can never exist without the
 * matching balance change actually having been applied, or vice versa.
 *
 * This still requires a replica-set (or sharded) MongoDB deployment,
 * since transactions do; standalone `mongod` does not support them. All
 * MongoDB Atlas tiers run as replica sets.
 *
 * Idempotency strategy
 * ---------------------
 * Clients may retry a payment or refund POST after a network failure
 * without knowing whether the original request succeeded. If the client
 * sends an `Idempotency-Key` header, it is stored on the payment
 * document under a unique index scoped to (userId, idempotencyKey). A
 * repeated request with the same key returns the original payment
 * instead of creating a new one. This is intentionally simple: a
 * per-request unique constraint, not a generalized distributed
 * idempotency cache with response replay/TTL.
 */

// Builds the $set stage shared by both payment and refund updates: the
// new totalPaidCents plus the status re-derived from it. Written as an
// aggregation-pipeline update (an array passed to findOneAndUpdate)
// specifically so `newTotalPaidExpr` and `$$NOW` can be evaluated
// server-side against the document's current state, keeping the status
// derivation atomic with the balance change instead of a separate
// application-level computation working off a value that could already
// be stale by the time it's written back.
function buildStatusPipelineStage(newTotalPaidExpr: Record<string, unknown>) {
  return {
    $set: {
      totalPaidCents: newTotalPaidExpr,
      status: {
        $let: {
          vars: { newPaid: newTotalPaidExpr },
          in: {
            $switch: {
              branches: [
                { case: { $gte: ["$$newPaid", "$totalCents"] }, then: "paid" },
                { case: { $lt: ["$dueDate", "$$NOW"] }, then: "overdue" },
                { case: { $gt: ["$$newPaid", 0] }, then: "partially_paid" },
              ],
              default: "pending",
            },
          },
        },
      },
    },
  };
}

export async function createPayment(
  userId: string,
  orderId: string,
  input: CreatePaymentInput,
  idempotencyKey?: string
): Promise<IPayment> {
  // Fast path: an identical retried request returns the original result
  // without touching the order at all.
  if (idempotencyKey) {
    const existing = await Payment.findOne({ userId, idempotencyKey });
    if (existing) return existing;
  }

  // Cheap existence/ownership pre-check purely for a clean 404 vs 403
  // error. This read is NOT the correctness guard — the atomic update
  // below is — so it doesn't need to be inside the transaction or
  // session at all.
  const existingOrder = await Order.findById(orderId);
  if (!existingOrder) throw new NotFoundError("Order not found.");
  if (existingOrder.userId.toString() !== userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }

  const session = await mongoose.startSession();

  try {
    let createdPayment: IPayment | null = null;

    await session.withTransaction(async () => {
      const updatedOrder = (await Order.findOneAndUpdate(
        {
          _id: orderId,
          userId,
          // The balance rule itself, evaluated by MongoDB against the
          // document's real state at write time: only apply this update
          // if doing so would not push totalPaidCents past totalCents.
          $expr: {
            $lte: [{ $add: ["$totalPaidCents", input.amountCents] }, "$totalCents"],
          },
        },
        [
          buildStatusPipelineStage({ $add: ["$totalPaidCents", input.amountCents] }),
          { $set: { isLocked: true } },
        ] as any,
        { new: true, session }
      )) as IOrder | null;

      if (!updatedOrder) {
     
        const current = await Order.findById(orderId).session(session);
        const remainingCents = current ? current.totalCents - current.totalPaidCents : 0;
        throw new ConflictError(
          "PAYMENT_EXCEEDS_BALANCE",
          `Payment exceeds the remaining balance of ${formatCents(remainingCents)}.`
        );
      }

      const paymentDocs = await Payment.create(
        [
          {
            orderId: updatedOrder._id,
            userId,
            type: "payment",
            amountCents: input.amountCents,
            paymentDate: input.paymentDate,
            note: input.note,
            ...(idempotencyKey ? { idempotencyKey } : {}),

          },
        ],
        { session }
      );
      createdPayment = paymentDocs[0];

      await recordAuditEvent(
        {
          userId,
          orderId: updatedOrder._id,
          action: "PAYMENT_RECORDED",
          metadata: {
            amountCents: input.amountCents,
            totalPaidCents: updatedOrder.totalPaidCents,
            newStatus: updatedOrder.status,
          },
        },
        session
      );
    });

    return createdPayment as unknown as IPayment;
  } catch (err: any) {
    // A duplicate idempotency key that raced past the fast-path check
    // above surfaces here as a Mongo E11000 error from inside the
    // transaction. Treat it the same as the fast path: return the
    // original payment rather than an error.

    console.log("PAYMENT ERROR", {
  code: err?.code,
  name: err?.name,
  message: err?.message,
});
    if (err?.code === 11000 && idempotencyKey) {
      const existing = await Payment.findOne({ userId, idempotencyKey });
      if (existing) return existing;
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

/**
 * Refunds
 * -------
 * Modeled as a Payment document with type "refund" rather than a negative
 * amountCents on a regular payment, for two reasons: (1) amountCents keeps
 * a single, simple invariant (always a positive magnitude, enforced at the
 * schema level) instead of overloading its sign to mean two different
 * things; (2) it keeps the overpayment-protection logic in createPayment
 * completely unchanged — a refund is a distinct code path with its own
 * bound (can't refund more than has actually been paid), not a payment
 * with a sign flip threaded through the same validation.
 *
 * A refund can never take totalPaidCents below zero: bounded by the
 * order's totalPaidCents via the same atomic-update pattern createPayment
 * uses, for the same reason — two concurrent refunds racing against a
 * balance that only covers one of them must not both succeed.
 *
 * Status is re-derived after every refund. A fully paid order that's
 * partially refunded correctly drops back to partially_paid; a partially
 * paid order refunded down to zero drops back to pending (or overdue, if
 * its due date has passed). isLocked is never touched by a refund — the
 * lock is a one-way door set by the first payment (see order.service.ts),
 * and a refund doesn't undo the fact that money changed hands against
 * this order's line items at some point.
 */
export async function createRefund(
  userId: string,
  orderId: string,
  input: CreateRefundInput,
  idempotencyKey?: string
): Promise<IPayment> {
  if (idempotencyKey) {
    const existing = await Payment.findOne({ userId, idempotencyKey });
    if (existing) return existing;
  }

  const existingOrder = await Order.findById(orderId);
  if (!existingOrder) throw new NotFoundError("Order not found.");
  if (existingOrder.userId.toString() !== userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }

  const session = await mongoose.startSession();

  try {
    let createdRefund: IPayment | null = null;

    await session.withTransaction(async () => {
      const updatedOrder = (await Order.findOneAndUpdate(
        {
          _id: orderId,
          userId,
          // Bounded by what's actually been paid, evaluated against the
          // document's real state at write time — same atomicity
          // argument as the payment case above.
          $expr: { $gte: ["$totalPaidCents", input.amountCents] },
        },
        [buildStatusPipelineStage({ $subtract: ["$totalPaidCents", input.amountCents] })] as any,
        { new: true, session }
      )) as IOrder | null;

      if (!updatedOrder) {
        const current = await Order.findById(orderId).session(session);
        const paidCents = current ? current.totalPaidCents : 0;
        throw new ConflictError(
          "REFUND_EXCEEDS_PAID",
          `Refund exceeds the amount actually paid (${formatCents(paidCents)}).`
        );
      }

      const refundDocs = await Payment.create(
        [
          {
            orderId: updatedOrder._id,
            userId,
            type: "refund",
            amountCents: input.amountCents,
            paymentDate: input.paymentDate,
            note: input.note,
            ...(idempotencyKey ? { idempotencyKey } : {}),
          },
        ],
        { session }
      );
      createdRefund = refundDocs[0];

      await recordAuditEvent(
        {
          userId,
          orderId: updatedOrder._id,
          action: "REFUND_RECORDED",
          metadata: {
            amountCents: input.amountCents,
            totalPaidCents: updatedOrder.totalPaidCents,
            newStatus: updatedOrder.status,
          },
        },
        session
      );
    });

    return createdRefund as unknown as IPayment;
  } catch (err: any) {
    if (err?.code === 11000 && idempotencyKey) {
      const existing = await Payment.findOne({ userId, idempotencyKey });
      if (existing) return existing;
    }
    throw err;
  } finally {
    await session.endSession();
  }
}

export async function listPayments(userId: string, orderId: string) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found.");
  if (order.userId.toString() !== userId) {
    throw new ForbiddenError("You do not have access to this order.");
  }

  // Returns both payments and refunds, newest first — the frontend
  // distinguishes them by the `type` field rather than this being two
  // separate endpoints, since "history for this order" is one concept.
  return Payment.find({ orderId }).sort({ paymentDate: -1 });
}
