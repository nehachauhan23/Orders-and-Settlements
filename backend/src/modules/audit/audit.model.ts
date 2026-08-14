import { Schema, model, models, Document, Types, Model } from "mongoose";

export type AuditAction =
  | "ORDER_CREATED"
  | "ORDER_UPDATED"
  | "ORDER_DELETED"
  | "PAYMENT_RECORDED"
  | "REFUND_RECORDED"
  | "ORDER_STATUS_CHANGED";

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: Types.ObjectId;
  action: AuditAction;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    action: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_UPDATED",
        "ORDER_DELETED",
        "PAYMENT_RECORDED",
        "REFUND_RECORDED",
        "ORDER_STATUS_CHANGED",
      ],
      required: true,
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
   
  }
);

auditLogSchema.index({ orderId: 1, createdAt: 1 });

export const AuditLog = (models.AuditLog as Model<IAuditLog>) || model<IAuditLog>("AuditLog", auditLogSchema);
