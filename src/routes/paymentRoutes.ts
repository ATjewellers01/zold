import { Router } from "express";
import * as paymentController from "../controllers/paymentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// All payment method routes require authentication
router.get("/", authMiddleware, paymentController.getPaymentMethods);
router.post("/", authMiddleware, paymentController.addPaymentMethod);
router.put("/:id", authMiddleware, paymentController.updatePaymentMethod);
router.delete("/:id", authMiddleware, paymentController.deletePaymentMethod);
router.put(
  "/:id/set-primary",
  authMiddleware,
  paymentController.setPrimaryMethod,
);

export default router;
