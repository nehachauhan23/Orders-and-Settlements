import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors";

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "One or more fields are invalid.",
        details: err.flatten(),
      },
    });
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
  }

  // Mongo duplicate key error (e.g. duplicate email, duplicate idempotency key)
  if (typeof err === "object" && err !== null && (err as any).code === 11000) {
    return res.status(409).json({
      error: {
        code: "DUPLICATE_RESOURCE",
        message: "This resource already exists.",
      },
    });
  }

  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred.",
    },
  });
}
