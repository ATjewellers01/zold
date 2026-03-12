import { Router } from "express";
import * as paymentMethodController from "../controllers/paymentMethodController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get all payment methods
router.get("/", paymentMethodController.getPaymentMethods);

// Add new payment methods
router.post("/bank", paymentMethodController.addBankAccount);
router.post("/upi", paymentMethodController.addUpiMethod);

// Set primary payment methods
router.put(
  "/bank/:accountId/primary",
  paymentMethodController.setPrimaryBankAccount,
);
router.put(
  "/upi/:methodId/primary",
  paymentMethodController.setPrimaryUpiMethod,
);

// Delete payment methods
router.delete("/bank/:accountId", paymentMethodController.deleteBankAccount);
router.delete("/upi/:methodId", paymentMethodController.deleteUpiMethod);

export default router;
