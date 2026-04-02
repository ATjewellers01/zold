import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as coinService from "../services/coinService.js";

export const getCoinTypes = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const coinTypes = await coinService.getCoinTypes();

    res.json({
      success: true,
      data: coinTypes,
    });
  } catch (error: any) {
    console.error("Error getting coin types:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coin types",
      error: error.message,
    });
  }
};

export const getUserCoinInventory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const inventory = await coinService.getUserCoinInventory(userId);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    console.error("Error getting coin inventory:", error);
    res.status(500).json({
      success: false,
      message: (error as any).message || "Failed to get coin inventory",
      error: error.message,
    });
  }
};

export const buyCoinWithRupees = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { coinGrams, quantity } = req.body;

    if (!coinGrams) {
      res.status(400).json({
        success: false,
        message: "Coin grams is required",
      });
      return;
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
  } catch (error: any) {
    console.error("Error buying coin:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to purchase coin",
      error: error.message,
    });
  }
};

export const convertWalletGoldToCoin = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { coinGrams, quantity } = req.body;

    if (!coinGrams) {
      res.status(400).json({
        success: false,
        message: "Coin grams is required",
      });
      return;
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
  } catch (error: any) {
    console.error("Error converting gold to coin:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to convert gold to coin",
      error: error.message,
    });
  }
};

export const getCoinTransactionHistory = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const transactions = await coinService.getCoinTransactionHistory(
      userId,
      limit,
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error: any) {
    console.error("Error getting coin transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get coin transactions",
      error: error.message,
    });
  }
};
