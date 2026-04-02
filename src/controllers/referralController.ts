import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as referralService from "../services/referralService.js";

export const getReferralStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const data = await referralService.getReferralStatsService(userId);

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching referral stats:", error);
    const status = error.message === "User not found" ? 404 : 500;
    res.status(status).json({
      success: false,
      message: "Failed to fetch referral stats",
      error: error.message,
    });
  }
};
