import { Router } from "express";
import * as orderController from "./order.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import paymentRoutes, { refundRouter } from "../payments/payment.routes";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(orderController.create));
router.get("/", asyncHandler(orderController.list));
router.get("/:id", asyncHandler(orderController.getById));
router.patch("/:id", asyncHandler(orderController.update));
router.delete("/:id", asyncHandler(orderController.remove));

// Nested payment/refund routes: /api/orders/:orderId/payments, /refunds
router.use("/:orderId/payments", paymentRoutes);
router.use("/:orderId/refunds", refundRouter);

export default router;
