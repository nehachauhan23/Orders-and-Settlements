import { Router } from "express";
import * as paymentController from "./payment.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router({ mergeParams: true });

router.post("/", asyncHandler(paymentController.create));
router.get("/", asyncHandler(paymentController.list));

const refundRouter = Router({ mergeParams: true });
refundRouter.post("/", asyncHandler(paymentController.createRefund));

export { refundRouter };
export default router;
