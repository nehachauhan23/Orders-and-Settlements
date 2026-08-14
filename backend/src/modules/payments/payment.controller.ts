import { Response } from "express";
import * as paymentService from "./payment.service";
import { createPaymentSchema, createRefundSchema } from "./payment.schema";
import { AuthenticatedRequest } from "../../middleware/auth";
import { toPaymentDTO } from "./payment.dto";

export async function create(req: AuthenticatedRequest, res: Response) {
  const input = createPaymentSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key") || undefined;

  const payment = await paymentService.createPayment(
    req.userId!,
    req.params.orderId,
    input,
    idempotencyKey
  );

  res.status(201).json({ payment: toPaymentDTO(payment) });
}

export async function createRefund(req: AuthenticatedRequest, res: Response) {
  const input = createRefundSchema.parse(req.body);
  const idempotencyKey = req.header("Idempotency-Key") || undefined;

  const refund = await paymentService.createRefund(
    req.userId!,
    req.params.orderId,
    input,
    idempotencyKey
  );

  res.status(201).json({ payment: toPaymentDTO(refund) });
}

export async function list(req: AuthenticatedRequest, res: Response) {
  const payments = await paymentService.listPayments(req.userId!, req.params.orderId);
  res.status(200).json({ payments: payments.map(toPaymentDTO) });
}
