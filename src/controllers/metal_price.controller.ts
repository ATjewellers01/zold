import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { updateMetalPriceService } from "../services/metal_price.service.js"

export const updateMetalPrice = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { metalPrice } = req.body;

        if (!metalPrice) {
            return res.status(400).json({
                success: false,
                message: "metalPrice is required"
            });
        }

        const result = await updateMetalPriceService(req.user!.id, metalPrice);
        return res.status(200).json({
            success: true,
            message: "Metal price updated successfully",
            data: result
        });
    }
    catch(error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Server error"
        });
    }
};
