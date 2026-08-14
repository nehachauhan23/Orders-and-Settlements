import { z } from "zod";

const lineItemInputSchema = z.object({
  description: z.string().trim().min(1, "Line item description is required").max(300),
  quantity: z.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  unitPriceCents: z
    .number()
    .int("Unit price must be an integer number of cents")
    .min(0, "Unit price cannot be negative"),
});

export const createOrderSchema = z.object({
  customer: z.string().trim().min(1, "Customer name is required").max(200),
  dueDate: z.coerce.date({ errorMap: () => ({ message: "A valid due date is required" }) }),
  lineItems: z.array(lineItemInputSchema).min(1, "At least one line item is required"),
});

export const updateOrderSchema = z.object({
  customer: z.string().trim().min(1).max(200).optional(),
  dueDate: z.coerce.date().optional(),
  lineItems: z.array(lineItemInputSchema).min(1, "At least one line item is required").optional(),
});

export const listOrdersQuerySchema = z.object({
  status: z.enum(["pending", "partially_paid", "paid", "overdue"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
