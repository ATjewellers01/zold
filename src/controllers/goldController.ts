import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as goldService from "../services/goldService";

export const getTestWallet = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const testWallet = await goldService.getTestWallet(userId);

    res.json({
      success: true,
      data: testWallet,
    });
  } catch (error: any) {
    console.error("Error getting test wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get test wallet",
      error: error.message,
    });
  }
};

export const addTestCredits = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
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
  } catch (error: any) {
    console.error("Error adding test credits:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add test credits",
      error: error.message,
    });
  }
};

export const resetTestWallet = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const testWallet = await goldService.resetTestWallet(userId);

    res.json({
      success: true,
      message: "Test wallet reset to ₹10,000",
      data: testWallet,
    });
  } catch (error: any) {
    console.error("Error resetting test wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset test wallet",
      error: error.message,
    });
  }
};

export const getCurrentGoldRate = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const goldRate = await goldService.getCurrentGoldRate();

    res.json({
      success: true,
      data: goldRate,
    });
  } catch (error: any) {
    console.error("Error getting gold rate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gold rate",
      error: error.message,
    });
  }
};

export const updateGoldRate = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { buyRate, sellRate } = req.body;

    if (!buyRate || !sellRate) {
      res.status(400).json({
        success: false,
        message: "Buy rate and sell rate are required",
      });
      return;
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
  } catch (error: any) {
    console.error("Error updating gold rate:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gold rate",
      error: error.message,
    });
  }
};

export const getGoldRateHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await goldService.getGoldRateHistory(limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error("Error getting gold rate history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get gold rate history",
      error: error.message,
    });
  }
};

export const buyGold = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { amountInRupees, goldGrams, storageType } = req.body;

    if (!amountInRupees || !goldGrams) {
      res.status(400).json({
        success: false,
        message: "Amount and gold grams are required",
      });
      return;
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
  } catch (error: any) {
    console.error("Error buying gold:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to purchase gold",
      error: error.message,
    });
  }
};

export const sellGold = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { goldGrams } = req.body;

    if (!goldGrams) {
      res.status(400).json({
        success: false,
        message: "Gold grams is required",
      });
      return;
    }

    if (parseFloat(goldGrams) <= 0) {
      res.status(400).json({
        success: false,
        message: "Gold grams must be greater than 0",
      });
      return;
    }

    const result = await goldService.sellGold(userId, { goldGrams });

    res.json({
      success: true,
      message: `Successfully sold ${goldGrams} grams of gold`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error selling gold:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to sell gold",
      error: error.message,
    });
  }
};

export const getTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await goldService.getTransactionHistory(userId, limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error("Error getting transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

export const getAllTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const transactions = await goldService.getAllTransactionHistory(limit);

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error("Error getting all transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};

export const getUserWalletBalance = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const walletData = await goldService.getUserWalletBalance(userId);

    res.json({
      success: true,
      data: walletData,
    });
  } catch (error: any) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet balance",
      error: error.message,
    });
  }
};

export const getWalletStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const stats = await goldService.getWalletStats(userId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    console.error("Error getting wallet stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get wallet stats",
      error: error.message,
    });
  }
};

export const getUserSellRequests = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const requests = await goldService.getUserSellRequests(userId);

    res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    console.error("Error getting user sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sell requests",
      error: error.message,
    });
  }
};

export const getPendingSellRequests = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const requests = await goldService.getPendingSellRequests();

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error("Error getting pending sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get pending sell requests",
      error: error.message,
    });
  }
};

export const getAllSellRequests = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { status, limit } = req.query;
    const requests = await goldService.getAllSellRequests(
      (status as string) || null,
      parseInt(limit as string) || 50,
    );

    res.json({
      success: true,
      data: requests,
      count: requests.length,
    });
  } catch (error: any) {
    console.error("Error getting all sell requests:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sell requests",
      error: error.message,
    });
  }
};

export const approveSellRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
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
  } catch (error: any) {
    console.error("Error approving sell request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to approve sell request",
      error: error.message,
    });
  }
};

export const rejectSellRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const adminId = req.user!.id;
    const { adminNotes } = req.body;

    if (!adminNotes) {
      res.status(400).json({
        success: false,
        message: "Admin notes/reason for rejection is required",
      });
      return;
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
  } catch (error: any) {
    console.error("Error rejecting sell request:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reject sell request",
      error: error.message,
    });
  }
};
