import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as walletService from "../services/walletService.js";

export const getUserWalletBalance = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const walletData = await walletService.getUserWalletBalance(userId);

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
    const stats = await walletService.getWalletStats(userId);

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
