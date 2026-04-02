import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as dashboardService from "../services/dashboardService.js";

export const getDashboardMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const data = await dashboardService.getDashboardMetricsService();
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTransactionAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { period = "7d" } = req.query;
    const data = await dashboardService.getTransactionAnalyticsService(period as string);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Analytics error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserGrowthAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { period = "30d" } = req.query;
    const data = await dashboardService.getUserGrowthAnalyticsService(period as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
