const express = require("express");
const router = express.Router();
const coinController = require("../controllers/coinController");
const { authMiddleware } = require("../middlewares/authMiddleware");

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

module.exports = router;
