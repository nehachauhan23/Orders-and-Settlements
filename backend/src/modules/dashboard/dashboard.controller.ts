import { Response } from "express";
import { z } from "zod";
import * as dashboardService from "./dashboard.service";
import { AuthenticatedRequest } from "../../middleware/auth";

const querySchema = z.object({
  status: z.enum(["pending", "partially_paid", "paid", "overdue"]).optional(),
});

export async function get(req: AuthenticatedRequest, res: Response) {
  const { status } = querySchema.parse(req.query);
  const data = await dashboardService.getDashboard(req.userId!, status);
  res.status(200).json(data);
}
