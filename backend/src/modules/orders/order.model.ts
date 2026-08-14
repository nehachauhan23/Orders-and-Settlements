import { Schema, model, models, Document, Types, Model } from "mongoose";

export type OrderStatus = "pending" | "partially_paid" | "paid" | "overdue";

export interface ILineItem {
  _id?: Types.ObjectId;
  description: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  customer: string;
  dueDate: Date;
  lineItems: ILineItem[];
  totalCents: number;
  totalPaidCents: number;
  status: OrderStatus;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Line items are embedded (not a separate collection) because they are
// owned entirely by the order, have no independent lifecycle, and are
// always read/written together with the order document.
const lineItemSchema = new Schema<ILineItem>(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceCents: { type: Number, required: true, min: 0 },
    subtotalCents: { type: Number, required: true, min: 0 },
  },
  { _id: true }
);

const orderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: String, required: true, trim: true },
    dueDate: { type: Date, required: true },
    lineItems: {
      type: [lineItemSchema],
      required: true,
      validate: {
        validator: (items: ILineItem[]) => items.length > 0,
        message: "An order must have at least one line item.",
      },
    },
    // totalCents is always recalculated server-side from lineItems; the
    // client never supplies this value directly (see order.service.ts).
    totalCents: { type: Number, required: true, min: 0 },
    // Denormalized running total of payments, kept in sync inside the
    // same transaction as payment creation so status can be derived
    // cheaply without an aggregation query on every read.
    totalPaidCents: { type: Number, required: true, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["pending", "partially_paid", "paid", "overdue"],
      required: true,
      default: "pending",
    },
    // Payments are treated as separate collection because they can grow
    // independently and have their own lifecycle. isLocked is set true
    // once the first payment is recorded, per business rule.
    isLocked: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

// Access pattern: dashboard filters "my orders by status"
orderSchema.index({ userId: 1, status: 1 });
// Access pattern: dashboard sorted/filtered by due date, overdue sweeps
orderSchema.index({ userId: 1, dueDate: 1 });

// Guarded against re-registration — see auth.model.ts for why.
export const Order = (models.Order as Model<IOrder>) || model<IOrder>("Order", orderSchema);
