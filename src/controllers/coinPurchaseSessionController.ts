import { Response } from "express";
import { Metal } from "../../generated/prisma/index.js";
import { AuthenticatedRequest } from "../types/index.js";
import {
    addCartItemService,
    removeCartItemService,
    cancelCoinPurchaseSessionService,
    createCoinRzpOrderService,
    failedCoinRzpPaymentService,
    getActiveCoinSessionService,
    initiateCoinPurchaseSessionService,
    verifyCoinRzpPaymentService
} from "../services/coinPurchaseSessionService.js";

export const addCartItem = async (req: AuthenticatedRequest, res: Response) => {
    const { weight, metal, quantity } = req.body;

    if (!weight || !metal) {
        return res.status(400).json({ success: false, message: "weight and metal are required" });
    }

    if (!["GOLD", "SILVER"].includes(metal)) {
        return res.status(400).json({ success: false, message: "metal must be GOLD or SILVER" });
    }

    const qty = Number(quantity) || 1;
    if (qty < 1) {
        return res.status(400).json({ success: false, message: "quantity must be at least 1" });
    }

    try {
        const result = await addCartItemService(req.user!.id, Number(weight), metal as Metal, qty);
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const removeCartItem = async (req: AuthenticatedRequest, res: Response) => {
    const { weight, metal, quantity, removeAll } = req.body;

    if (!weight || !metal) {
        return res.status(400).json({ success: false, message: "weight and metal are required" });
    }

    if (!["GOLD", "SILVER"].includes(metal)) {
        return res.status(400).json({ success: false, message: "metal must be GOLD or SILVER" });
    }

    const qty = Number(quantity) || 1;
    if (qty < 1) {
        return res.status(400).json({ success: false, message: "quantity must be at least 1" });
    }

    try {
        const result = await removeCartItemService(
            req.user!.id,
            Number(weight),
            metal as Metal,
            qty,
            Boolean(removeAll)
        );
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const initiateCoinPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await initiateCoinPurchaseSessionService(req.user!.id);
        return res.status(201).json({
            success: true,
            message: "Session initiated successfully",
            data: result
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const createCoinRazorpayOrder = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ success: false, message: "Session id required" });
    }

    try {
        const result = await createCoinRzpOrderService(sessionId, req.user!.id);
        return res.status(201).json({ success: true, message: "Order created successfully", data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const verifyCoinRazorPayment = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId, orderId, paymentId, signature } = req.body;

    if (!sessionId || !orderId || !paymentId || !signature) {
        return res.status(400).json({ success: false, message: "sessionId, orderId, paymentId and signature are required" });
    }

    try {
        const result = await verifyCoinRzpPaymentService(
            sessionId,
            req.user!.id,
            orderId,
            paymentId,
            signature
        );
        return res.status(200).json({ success: true, message: "Payment successfully verified", data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const failedCoinRazorPayment = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, reason } = req.body;

    if (!sessionId || !orderId) {
        return res.status(400).json({ success: false, message: "sessionId and razorpay_order_id are required" });
    }

    try {
        const result = await failedCoinRzpPaymentService(
            req.user!.id,
            sessionId,
            orderId,
            paymentId,
            reason
        );
        return res.status(200).json({ success: true, message: "Payment failure recorded", data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const getActiveCoinSession = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const result = await getActiveCoinSessionService(req.user!.id);
        return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};

export const cancelCoinPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({ success: false, message: "Session id required" });
    }

    try {
        const result = await cancelCoinPurchaseSessionService(sessionId, req.user!.id);
        return res.status(200).json({ success: true, message: "Session cancelled", data: result });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message || "Something went wrong" });
    }
};
