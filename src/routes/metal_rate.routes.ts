import { Router } from "express";
import * as ratesController from "../controllers/metal_rate.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// Public — no auth needed to fetch current rates
router.get("/current", ratesController.getCurrentMetalRate);

// Live market price (admin only — hits external API directly)
router.get("/live-market", authMiddleware, roleMiddleware("ADMIN"), ratesController.getLiveMarketRatesHandler);

// Auth required
router.get("/history", authMiddleware, ratesController.getMetalRateHistoryHandler);

// Admin only
router.post("/update", authMiddleware, roleMiddleware("ADMIN"), ratesController.updateMetalRateHandler);

export default router;
