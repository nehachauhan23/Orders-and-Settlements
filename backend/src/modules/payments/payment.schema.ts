import { z } from "zod";

export const createPaymentSchema = z.object({
  amountCents: z
    .number()
    .int("Amount must be an integer number of cents")
    .min(1, "Amount must be greater than zero"),
  paymentDate: z.coerce.date({ errorMap: () => ({ message: "A valid payment date is required" }) }),
  note: z.string().trim().max(500).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const createRefundSchema = z.object({
  amountCents: z
    .number()
    .int("Amount must be an integer number of cents")
    .min(1, "Amount must be greater than zero"),
  paymentDate: z.coerce.date({ errorMap: () => ({ message: "A valid refund date is required" }) }),
  note: z.string().trim().max(500).optional(),
});

export type CreateRefundInput = z.infer<typeof createRefundSchema>;
