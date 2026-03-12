import { Router } from "express";
import * as goldController from "../controllers/goldController";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Test Wallet Routes (requires authentication)
router.get("/test-wallet", authMiddleware, goldController.getTestWallet);
router.post(
  "/test-wallet/add-credits",
  authMiddleware,
  goldController.addTestCredits,
);
router.post(
  "/test-wallet/reset",
  authMiddleware,
  goldController.resetTestWallet,
);

// Gold Rate Routes
router.get("/rates/current", goldController.getCurrentGoldRate);
router.post(
  "/rates",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.updateGoldRate,
);
router.get("/rates/history", authMiddleware, goldController.getGoldRateHistory);

// Buy Gold Routes
router.post("/buy", authMiddleware, goldController.buyGold);

// Sell Gold Routes
router.post("/sell", authMiddleware, goldController.sellGold);

// Sell Gold Request Routes (Approval Workflow)
router.get(
  "/sell-requests",
  authMiddleware,
  goldController.getUserSellRequests,
);
router.get(
  "/sell-requests/pending",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.getPendingSellRequests,
);
router.get(
  "/sell-requests/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.getAllSellRequests,
);
router.post(
  "/sell-requests/:id/approve",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.approveSellRequest,
);
router.post(
  "/sell-requests/:id/reject",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.rejectSellRequest,
);

// Transaction History Routes
router.get(
  "/transactions",
  authMiddleware,
  goldController.getTransactionHistory,
);
router.get(
  "/transactions/all",
  authMiddleware,
  roleMiddleware("ADMIN"),
  goldController.getAllTransactionHistory,
);

// Wallet Balance Routes
router.get(
  "/wallet/balance",
  authMiddleware,
  goldController.getUserWalletBalance,
);
router.get("/wallet/stats", authMiddleware, goldController.getWalletStats);

export default router;
