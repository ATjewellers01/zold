import { Router } from "express";
import * as coinController from "../controllers/coinController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// Get available coin types (public)
router.get("/types", coinController.getCoinTypes);

// User coin inventory (requires authentication)
router.get("/inventory", authMiddleware, coinController.getUserCoinInventory);

// Buy coin with rupees (requires authentication)
router.post("/buy", authMiddleware, coinController.buyCoinWithRupees);

// Convert wallet gold to coin (requires authentication)
router.post("/convert", authMiddleware, coinController.convertWalletGoldToCoin);

// Get coin transaction history (requires authentication)
router.get(
  "/transactions",
  authMiddleware,
  coinController.getCoinTransactionHistory,
);

export default router;
