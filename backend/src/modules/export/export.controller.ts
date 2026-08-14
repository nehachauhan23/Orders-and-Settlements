import { Response } from "express";
import { z } from "zod";
import { buildOrdersCsv } from "./export.service";
import { AuthenticatedRequest } from "../../middleware/auth";
import { ValidationError } from "../../utils/errors";

const exportQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    status: z.enum(["pending", "partially_paid", "paid", "overdue"]).optional(),
  })
  .refine((q) => !q.from || !q.to || q.from <= q.to, {
    message: "'from' must be on or before 'to'.",
  });

export async function exportOrdersCsv(req: AuthenticatedRequest, res: Response) {
  const query = exportQuerySchema.parse(req.query);
  if (query.from && query.to && query.from > query.to) {
    throw new ValidationError("'from' must be on or before 'to'.");
  }

  const csv = await buildOrdersCsv({
    userId: req.userId!,
    from: query.from,
    to: query.to,
    status: query.status,
  });

  const datePart = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orders-export-${datePart}.csv"`);
  res.status(200).send(csv);
}
