import { ClientSession, Types } from "mongoose";
import { AuditLog, AuditAction } from "./audit.model";

export async function recordAuditEvent(
  params: {
    userId: Types.ObjectId | string;
    orderId: Types.ObjectId | string;
    action: AuditAction;
    metadata?: Record<string, unknown>;
  },
  session?: ClientSession
): Promise<void> {
  await AuditLog.create(
    [
      {
        userId: params.userId,
        orderId: params.orderId,
        action: params.action,
        metadata: params.metadata,
      },
    ],
    session ? { session } : undefined
  );
}

export async function getAuditLogForOrder(orderId: string, userId: string) {
  return AuditLog.find({ orderId, userId }).sort({ createdAt: 1 }).lean();
}
