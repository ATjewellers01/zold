import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { addToPrimaryCartService, executeCoinPurchaseSessionService, initiateCoinPurchaseSessionService } from "../services/coinPurchaseSessionService.js"

export const addToPrimaryCart = async (req: AuthenticatedRequest, res: Response) => {
    const { gold, silver } = req.body?.metalDetails || {};
    if(!gold && !silver) {
        return res.status(400).json({
            success: false,
            message: "Metal details missing"
        });
    }

    if(gold && !gold.weight) {
        return res.status(400).json({
            success: false,
            message: "Gold weight details missing"
        });
    }

    if(silver && !silver.weight) {
        return res.status(400).json({
            success: false,
            message: "Silver weight details missing"
        });
    }

    try {
        const result = await addToPrimaryCartService(req.body.metalDetails, req.user!.id);
        return res.status(201).json({
            success: true,
            message: "Items added to cart successfully",
            data: result
        });
    }
    catch(error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

export const initiateCoinPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    const { cartId } = req.params;
    if(!cartId) {
        return res.status(400).json({
            success: false,
            message: "Cart id required"
        });
    }

    try {
        const result = await initiateCoinPurchaseSessionService(cartId, req.user!.id);
        return res.status(201).json({
            success: true,
            message: "Complete your payment",
            data: result
        });
    }
    catch(error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export const executeCoinPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.body;
    if(!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session id required"
        });
    }

    try {
        const result = await executeCoinPurchaseSessionService(sessionId, req.user!.id);
        return res.status(200).json({
            success: true,
            message: "Purchase completed successfully",
            data: result
        });
    }
    catch(error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};
