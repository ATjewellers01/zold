import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as testWalletService from "../services/testWalletService.js";

export const getTestWallet = async (req, res) => {
  try {
    const userId = req.user.id;
    const testWallet = await testWalletService.getTestWallet(userId);

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

export const addTestCredits = async (req, res): Promise<void> => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    const testWallet = await testWalletService.addTestCredits(
      userId,
      amount || 10000
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
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const testWallet = await testWalletService.resetTestWallet(userId);

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
