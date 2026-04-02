import { Router } from "express";
import { initiateMetalPurchaseSession, checkoutMetalPurchase, getActiveSession, cancelMetalPurchaseSession } from "../controllers/metalPurchaseSessionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateMetalPurchaseSession } from "../middlewares/metalPurchaseSessionMiddleware.js";

const router = Router();

router.get(
  "/active",
  authMiddleware,
  getActiveSession
);

router.post(
  "/initiate",
  authMiddleware,
  initiateMetalPurchaseSession
);

router.post(
  "/checkout",
  authMiddleware,
  validateMetalPurchaseSession,
  checkoutMetalPurchase
);

router.post(
  "/cancel",
  authMiddleware,
  cancelMetalPurchaseSession
);

export default router;