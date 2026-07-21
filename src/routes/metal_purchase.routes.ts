import { Router } from "express";

import {
  initiateMetalPurchaseSession,
  getActiveSession,
  cancelMetalPurchaseSession,
  createMetalRazorpayOrder,
  verifyMetalRazorPayment,
  executeMetalSell,
  failedMetalRazorPayment
} from "../controllers/metal_purchase.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { validateMetalPurchaseSession } from "../middlewares/metal_purchase.middleware.js";

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
  "/create-order",
  authMiddleware,
  validateMetalPurchaseSession,
  createMetalRazorpayOrder
);


router.post("/verify-payment",
  authMiddleware,
  verifyMetalRazorPayment
);

router.post("/checkout",
  authMiddleware,
  executeMetalSell
);

router.post("/payment-failed",
  authMiddleware,
  failedMetalRazorPayment
);

router.post(
  "/cancel",
  authMiddleware,
  cancelMetalPurchaseSession
);

export default router;