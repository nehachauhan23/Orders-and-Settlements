import { Schema, model, models, Document, Types, Model } from "mongoose";

export type PaymentType = "payment" | "refund";

export interface IPayment extends Document {
  _id: Types.ObjectId;
  orderId: Types.ObjectId;
  userId: Types.ObjectId;
  type: PaymentType;
  amountCents: number;
  paymentDate: Date;
  note?: string;
  idempotencyKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["payment", "refund"],
      required: true,
      default: "payment",
    },
    amountCents: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true },
    note: { type: String, trim: true },
    idempotencyKey: { type: String },
  },
  { timestamps: true },
);

paymentSchema.index({ orderId: 1, paymentDate: 1 });
paymentSchema.index({ userId: 1, orderId: 1 });
paymentSchema.index(
  { userId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: "string" },
    },
  },
);

// Guarded against re-registration — see auth.model.ts for why.
export const Payment =
  (models.Payment as Model<IPayment>) ||
  model<IPayment>("Payment", paymentSchema);
