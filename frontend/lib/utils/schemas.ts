import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const signupFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});
export type SignupFormValues = z.infer<typeof signupFormSchema>;

const lineItemFormSchema = z.object({
  description: z.string().trim().min(1, "Description is required"),
  quantity: z.coerce.number().int("Whole numbers only").min(1, "Must be at least 1"),
  unitPrice: z.coerce.number().min(0, "Cannot be negative"),
});

export const orderFormSchema = z.object({
  customer: z.string().trim().min(1, "Customer name is required"),
  dueDate: z.string().min(1, "Due date is required"),
  lineItems: z.array(lineItemFormSchema).min(1, "Add at least one line item"),
});
export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const paymentFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().min(1, "Payment date is required"),
  note: z.string().trim().max(500).optional(),
});
export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const refundFormSchema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().min(1, "Refund date is required"),
  note: z.string().trim().max(500).optional(),
});
export type RefundFormValues = z.infer<typeof refundFormSchema>;

export const exportFormSchema = z
  .object({
    from: z.string().optional(),
    to: z.string().optional(),
    status: z.enum(["pending", "partially_paid", "paid", "overdue"]).optional(),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: "Start date must be on or before end date",
    path: ["to"],
  });
export type ExportFormValues = z.infer<typeof exportFormSchema>;
