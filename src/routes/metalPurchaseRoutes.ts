import { Router } from "express";

import { 
  initiateMetalPurchaseSession, 
  getActiveSession, 
  cancelMetalPurchaseSession, 
  createRazorpayOrder, 
  verifyRazorPayment 
} from "../controllers/metalPurchaseSessionController.js";
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
  "/create-order",
  authMiddleware,
  validateMetalPurchaseSession,
  createRazorpayOrder
);


router.post("/verify-payment",
  authMiddleware,
  verifyRazorPayment
);

router.post(
  "/cancel",
  authMiddleware,
  cancelMetalPurchaseSession
);

export default router;