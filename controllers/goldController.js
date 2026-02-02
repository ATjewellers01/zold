const goldService = require("../services/goldService");

/**
 * Get user's test wallet
 */
const getTestWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const testWallet = await goldService.getTestWallet(userId);

    res.json({
      success: true,
      data: testWallet,
    });
  } catch (error) {
    console.error("Error getting test wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get test wallet",
      error: error.message,
    });
  }
};

/**
 * Add test credits to wallet
 */
const addTestCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const testWallet = await goldService.addTestCredits(
      userId,
      amount || 10000,
    );

    res.json({
      success: true,
      message: `₹${amount || 10000} test credits added successfully`,
      data: testWallet,
    });
  } catch (error) {
    console.error("Error adding test credits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add test credits",
      error: error.message,
    });
  }
};

/**
 * Reset test wallet
 */
const resetTestWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const testWallet = await goldService.resetTestWallet(userId);

    res.json({
      success: true,
      message: "Test wallet reset to ₹10,000",
      data: testWallet,
    });
  } catch (error) {
    console.error("Error resetting test wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset test wallet",
      error: error.message,
    });
  }
};

/**
 * Get current gold rate
 */
const getCurrentGoldRate = async (req, res) => {
  try {
    const goldRate = await goldService.getCurrentGoldRate();

    res.json({
      success: true,
      data: goldRate,
    });
  } catch (error) {
    console.error("Error getting gold rate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gold rate",
      error: error.message,
    });
  }
};

/**
 * Update gold rate (Admin only)
 */
const updateGoldRate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { buyRate, sellRate } = req.body;

    if (!buyRate || !sellRate) {
      return res.status(400).json({
        success: false,
        message: "Buy rate and sell rate are required",
      });
    }

    const goldRate = await goldService.updateGoldRate(
      buyRate,
      sellRate,
      userId,
    );

    res.json({
      success: true,
      message: "Gold rate updated successfully",
      data: goldRate,
    });
  } catch (error) {
    console.error("Error updating gold rate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gold rate",
      error: error.message,
    });
  }
};

/**
 * Get gold rate history
 */
const getGoldRateHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await goldService.getGoldRateHistory(limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Error getting gold rate history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gold rate history",
      error: error.message,
    });
  }
};

/**
 * Buy gold
 */
const buyGold = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amountInRupees, goldGrams, storageType } = req.body;

    if (!amountInRupees || !goldGrams) {
      return res.status(400).json({
        success: false,
        message: "Amount and gold grams are required",
      });
    }

    const result = await goldService.buyGold(userId, {
      amountInRupees,
      goldGrams,
      storageType,
    });

    res.json({
      success: true,
      message: `Successfully purchased ${goldGrams} grams of gold`,
      data: result,
    });
  } catch (error) {
    console.error("Error buying gold:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to purchase gold",
      error: error.message,
    });
  }
};

/**
 * Sell gold
 */
const sellGold = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goldGrams } = req.body;

    if (!goldGrams) {
      return res.status(400).json({
        success: false,
        message: "Gold grams is required",
      });
    }

    if (parseFloat(goldGrams) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Gold grams must be greater than 0",
      });
    }

    const result = await goldService.sellGold(userId, {
      goldGrams,
    });

    res.json({
      success: true,
      message: `Successfully sold ${goldGrams} grams of gold`,
      data: result,
    });
  } catch (error) {
    console.error("Error selling gold:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to sell gold",
      error: error.message,
    });
  }
};

/**
 * Get user's transaction history
 */
const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 20;

    const transactions = await goldService.getTransactionHistory(userId, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error getting transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

/**
 * Get all transaction history (Admin only)
 */
const getAllTransactionHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = await goldService.getAllTransactionHistory(limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Error getting all transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

/**
 * Get user's wallet balance
 */
const getUserWalletBalance = async (req, res) => {
  try {
    const userId = req.user.id;
    const walletData = await goldService.getUserWalletBalance(userId);

    res.json({
      success: true,
      data: walletData,
    });
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet balance",
      error: error.message,
    });
  }
};

/**
 * Get wallet statistics
 */
const getWalletStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await goldService.getWalletStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error getting wallet stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet stats",
      error: error.message,
    });
  }
};

/**
 * Get user's sell gold requests
 */
const getUserSellRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const requests = await goldService.getUserSellRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Error getting user sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sell requests",
      error: error.message,
    });
  }
};

/**
 * Get all pending sell requests (Admin only)
 */
const getPendingSellRequests = async (req, res) => {
  try {
    const requests = await goldService.getPendingSellRequests();

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("Error getting pending sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending sell requests",
      error: error.message,
    });
  }
};

/**
 * Get all sell requests with optional status filter (Admin only)
 */
const getAllSellRequests = async (req, res) => {
  try {
    const { status, limit } = req.query;
    const requests = await goldService.getAllSellRequests(
      status || null,
      parseInt(limit) || 50,
    );

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error) {
    console.error("Error getting all sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sell requests",
      error: error.message,
    });
  }
};

/**
 * Approve a sell gold request (Admin only)
 */
const approveSellRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    const result = await goldService.approveSellGoldRequest(
      id,
      adminId,
      adminNotes || null,
    );

    res.json({
      success: true,
      message:
        "Sell request approved successfully. Amount credited to user wallet.",
      data: result,
    });
  } catch (error) {
    console.error("Error approving sell request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve sell request",
      error: error.message,
    });
  }
};

/**
 * Reject a sell gold request (Admin only)
 */
const rejectSellRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { adminNotes } = req.body;

    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: "Admin notes/reason for rejection is required",
      });
    }

    const result = await goldService.rejectSellGoldRequest(
      id,
      adminId,
      adminNotes,
    );

    res.json({
      success: true,
      message: "Sell request rejected. Gold returned to user wallet.",
      data: result,
    });
  } catch (error) {
    console.error("Error rejecting sell request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject sell request",
      error: error.message,
    });
  }
};

module.exports = {
  getTestWallet,
  addTestCredits,
  resetTestWallet,
  getCurrentGoldRate,
  updateGoldRate,
  getGoldRateHistory,
  buyGold,
  sellGold,
  getUserSellRequests,
  getPendingSellRequests,
  getAllSellRequests,
  approveSellRequest,
  rejectSellRequest,
  getTransactionHistory,
  getAllTransactionHistory,
  getUserWalletBalance,
  getWalletStats,
};
