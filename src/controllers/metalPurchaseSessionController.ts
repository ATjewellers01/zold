import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import {
    initiateMetalPurchaseSessionService,
    executeMetalPurchaseService,
    getActiveSessionService,
    cancelMetalPurchaseSessionService
} from "../services/metalPurchaseSessionService"

const VALID_METALS = ["GOLD", "SILVER"] as const;
const VALID_TRANSACTION_TYPES = ["BUY", "SELL"] as const;

export const initiateMetalPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { metalType, transactionType, metalGrams } = req.body;

        if (!metalType || !transactionType || !metalGrams) {
            return res.status(400).json({
                success: false,
                message: "metalType, transactionType, and metalGrams are required"
            });
        }

        if (!VALID_METALS.includes(metalType)) {
            return res.status(400).json({
                success: false,
                message: "metalType must be GOLD or SILVER"
            });
        }

        if (!VALID_TRANSACTION_TYPES.includes(transactionType)) {
            return res.status(400).json({
                success: false,
                message: "transactionType must be BUY or SELL"
            });
        }

        const grams = Number(metalGrams);
        if (isNaN(grams) || grams <= 0) {
            return res.status(400).json({
                success: false,
                message: "metalGrams must be a positive number"
            });
        }

        const result = await initiateMetalPurchaseSessionService(
            req.user!.id,
            metalType,
            transactionType,
            grams
        );

        return res.status(201).json({
            success: true,
            message: "Session created, complete your payment",
            data: result
        });
    }
    catch(error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to initiate session",
        });
    }
};

export const checkoutMetalPurchase = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const sessionId = req.body?.sessionId || req.metalPurchaseSession?.id;
        const { paymentMode, storageType } = req.body;

        const result = await executeMetalPurchaseService(
            userId,
            sessionId,
            paymentMode || "WALLET",
            storageType || "vault"
        );

        return res.status(200).json({
            success: true,
            message: "Transaction completed successfully",
            data: result
        });

    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Checkout failed"
        });
    }
};

export const getActiveSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const result = await getActiveSessionService(userId);

        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch active session"
        });
    }
};

export const cancelMetalPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.user!.id;
        const { sessionId } = req.body;

        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: "sessionId is required"
            });
        }

        const result = await cancelMetalPurchaseSessionService(userId, sessionId);

        return res.status(200).json({
            success: true,
            message: "Session cancelled successfully",
            data: result
        });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Failed to cancel session"
        });
    }
};
