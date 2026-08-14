import { Router } from "express";
import * as dashboardController from "./dashboard.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", requireAuth, asyncHandler(dashboardController.get));

export default router;
