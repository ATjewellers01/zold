import { Router } from "express";
import * as testWalletController from "../controllers/testWalletController.js";
import * as walletController from "../controllers/walletController.js";
import * as transactionController from "../controllers/transactionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.get("/test-wallet", authMiddleware, testWalletController.getTestWallet);
router.post("/test-wallet/add-credits", authMiddleware, testWalletController.addTestCredits);
router.post("/test-wallet/reset", authMiddleware, testWalletController.resetTestWallet);

router.get("/balance", authMiddleware, walletController.getUserWalletBalance);
router.get("/stats", authMiddleware, walletController.getWalletStats);

router.get("/transactions", authMiddleware, transactionController.getUserTransactionsHistory);

export default router;
