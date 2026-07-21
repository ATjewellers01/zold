import { Router } from "express";
import * as walletController from "../controllers/wallet.controller.js";
import * as transactionController from "../controllers/transaction.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/balance", authMiddleware, walletController.getUserWalletBalance);
router.get("/stats", authMiddleware, walletController.getWalletStats);

router.get("/transactions", authMiddleware, transactionController.getUserTransactionsHistory);

export default router;
