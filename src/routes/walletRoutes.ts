import { Router } from "express";
import * as walletController from "../controllers/walletController.js";
import * as transactionController from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/balance", authMiddleware, walletController.getUserWalletBalance);
router.get("/stats", authMiddleware, walletController.getWalletStats);

router.get("/transactions", authMiddleware, transactionController.getUserTransactionsHistory);

export default router;
