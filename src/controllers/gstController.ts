import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as gstService from "../services/gstService.js";

/**
 * Public endpoint to get current GST rate (whole number)
 */
export const getGstRate = async (req: Request, res: Response) => {
    try {
        const rate = await gstService.getCurrentGstRateWhole();
        return res.json({ success: true, data: { rate } });
    } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Admin endpoint to update GST rate
 */
export const setGstRate = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { rate } = req.body;
        if (rate === undefined || rate === null) {
             return res.status(400).json({ success: false, message: "GST rate is required" });
        }

        const numRate = Number(rate);
        if (isNaN(numRate) || numRate < 0 || numRate > 100) {
            return res.status(400).json({ success: false, message: "GST rate must be a number between 0 and 100" });
        }

        const adminId = req.user?.id;
        if (!adminId) {
             return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const newConfig = await gstService.updateGstRate(Number(rate), adminId);
        return res.json({
            success: true,
            message: "GST rate updated successfully",
            data: newConfig
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const getGstHistory = async (req: Request, res: Response) => {
  try {
    const history = await gstService.getGstHistory();
    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
