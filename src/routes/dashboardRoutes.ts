import { Router } from "express";
import * as dashboardController from "../controllers/dashboardController";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All dashboard routes require admin authentication
router.get(
  "/metrics",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getDashboardMetrics,
);

router.get(
  "/analytics/transactions",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getTransactionAnalytics,
);

router.get(
  "/analytics/users",
  authMiddleware,
  roleMiddleware("ADMIN"),
  dashboardController.getUserGrowthAnalytics,
);

export default router;
