import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import {
  getCurrentGoldRate,
  getCurrentSilverRate,
  updateMetalRate,
  getMetalRateHistory,
} from "../services/metal_rate.service.js";
import { getGoldLivePrice } from "../services/gold_api.service.js";
import { getSilverLivePrice } from "../services/silver_api_service.js";


export const getCurrentMetalRate = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const goldRate = await getCurrentGoldRate();
    const silverRate = await getCurrentSilverRate();
    
    res.json({ success: true, data: { goldRate, silverRate } });
  } 
  catch (error: any) {
    console.error("Error getting gold rate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMetalRateHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { metal, buyRate, sellRate } = req.body;

    if (!metal || !buyRate || !sellRate) {
      res.status(400).json({
        success: false,
        message: "metal, buyRate, and sellRate are required",
      });
      return;
    }

    if (metal !== "GOLD" && metal !== "SILVER") {
      res.status(400).json({
        success: false,
        message: "metal must be GOLD or SILVER",
      });
      return;
    }

    const rate = await updateMetalRate(metal, buyRate, sellRate, userId);
    res.json({ success: true, message: `${metal} rate updated successfully`, data: rate });
  } catch (error: any) {
    console.error("Error updating metal rate:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMetalRateHistoryHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const metal = req.query.metal as "GOLD" | "SILVER" | undefined;

    const history = await getMetalRateHistory(metal, limit);
    res.json({ success: true, data: history });
  } catch (error: any) {
    console.error("Error getting rate history:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLiveMarketRatesHandler = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const [gold, silver] = await Promise.all([
      getGoldLivePrice(),
      getSilverLivePrice(),
    ]);
    res.json({ success: true, data: { gold, silver } });
  } catch (error: any) {
    console.error("Error fetching live market rates:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
