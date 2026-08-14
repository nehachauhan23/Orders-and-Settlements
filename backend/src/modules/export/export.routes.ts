import { Router } from "express";
import * as exportController from "./export.controller";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/orders", requireAuth, asyncHandler(exportController.exportOrdersCsv));

export default router;
