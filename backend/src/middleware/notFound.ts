import { Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: `No route matches ${req.method} ${req.originalUrl}`,
    },
  });
}
