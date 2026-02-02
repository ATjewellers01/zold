const coinService = require("../services/coinService");

/**
 * Get available coin types with prices
 */
const getCoinTypes = async (req, res) => {
  try {
    const coinTypes = await coinService.getCoinTypes();

    res.json({
      success: true,
      data: coinTypes,
    });
  } catch (error) {
    console.error("Error getting coin types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coin types",
      error: error.message,
    });
  }
};

/**
 * Get user's coin inventory
 */
const getUserCoinInventory = async (req, res) => {
  try {
    const userId = req.user.id;
    const inventory = await coinService.getUserCoinInventory(userId);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    console.error("Error getting coin inventory:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coin inventory",
      error: error.message,
    });
  }
};

/**
 * Buy coin with rupees
 */
const buyCoinWithRupees = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coinGrams, quantity } = req.body;

    if (!coinGrams) {
      return res.status(400).json({
        success: false,
        message: "Coin grams is required",
      });
    }

    const result = await coinService.buyCoinWithRupees(
      userId,
      parseInt(coinGrams),
      parseInt(quantity) || 1,
    );

    res.json({
      success: true,
      message: `Successfully purchased ${quantity || 1} x ${coinGrams}g gold coin(s)`,
      data: result,
    });
  } catch (error) {
    console.error("Error buying coin:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to purchase coin",
      error: error.message,
    });
  }
};

/**
 * Convert wallet gold to coin
 */
const convertWalletGoldToCoin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { coinGrams, quantity } = req.body;

    if (!coinGrams) {
      return res.status(400).json({
        success: false,
        message: "Coin grams is required",
      });
    }

    const result = await coinService.convertWalletGoldToCoin(
      userId,
      parseInt(coinGrams),
      parseInt(quantity) || 1,
    );

    res.json({
      success: true,
      message: `Successfully converted ${result.goldDeducted}g gold to ${quantity || 1} x ${coinGrams}g coin(s)`,
      data: result,
    });
  } catch (error) {
    console.error("Error converting gold to coin:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to convert gold to coin",
      error: error.message,
    });
  }
};

/**
 * Get coin transaction history
 */
const getCoinTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await coinService.getCoinTransactionHistory(
      userId,
      limit,
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error getting coin transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coin transactions",
      error: error.message,
    });
  }
};

module.exports = {
  getCoinTypes,
  getUserCoinInventory,
  buyCoinWithRupees,
  convertWalletGoldToCoin,
  getCoinTransactionHistory,
};
