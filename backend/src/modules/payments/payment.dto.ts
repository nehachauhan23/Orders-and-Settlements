import { IPayment } from "./payment.model";

export function toPaymentDTO(payment: IPayment) {
  return {
    id: payment._id.toString(),
    orderId: payment.orderId.toString(),
    type: payment.type,
    amountCents: payment.amountCents,
    paymentDate: payment.paymentDate,
    note: payment.note ?? null,
    createdAt: payment.createdAt,
  };
}
