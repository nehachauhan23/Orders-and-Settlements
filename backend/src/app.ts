import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./modules/auth/auth.routes";
import orderRoutes from "./modules/orders/order.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import exportRoutes from "./modules/export/export.routes";

import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/exports", exportRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
