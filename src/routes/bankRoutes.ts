import { Router } from "express";
import * as bankController from "../controllers/bankController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// All bank account routes require authentication
router.get("/", authMiddleware, bankController.getBankAccounts);
router.post("/", authMiddleware, bankController.addBankAccount);
router.put("/:id", authMiddleware, bankController.updateBankAccount);
router.delete("/:id", authMiddleware, bankController.deleteBankAccount);
router.put(
  "/:id/set-primary",
  authMiddleware,
  bankController.setPrimaryAccount,
);

export default router;
