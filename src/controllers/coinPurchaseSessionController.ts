import { Response } from "express";

import { AuthenticatedRequest } from "../types/index.js";
import {
    addToPrimaryCartService,
    cancelCoinPurchaseSessionService,
    createCoinRzpOrderService,
    failedCoinRzpPaymentService,
    initiateCoinPurchaseSessionService,
    verifyCoinRzpPaymentService
 }
 from "../services/coinPurchaseSessionService.js"

export const addToPrimaryCart = async (req: AuthenticatedRequest, res: Response) => {
    const { gold, silver } = req.body?.metalDetails || {};
    if (!gold && !silver) {
        return res.status(400).json({
            success: false,
            message: "Metal details missing"
        });
    }

    if (gold && !gold.weight) {
        return res.status(400).json({
            success: false,
            message: "Gold weight details missing"
        });
    }

    if (silver && !silver.weight) {
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
    catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong",
        });
    }
};

export const initiateCoinPurchaseSession = async (req: AuthenticatedRequest, res: Response) => {
    const { cartId } = req.params;
    if (!cartId) {
        return res.status(400).json({
            success: false,
            message: "Cart id required"
        });
    }

    try {
        const result = await initiateCoinPurchaseSessionService(cartId, req.user!.id);
        return res.status(201).json({
            success: true,
            message: "Session initiated successfully",
            data: result
        });
    }
    catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export const createCoinRazorpayOrder = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId } = req.body;
    if (!sessionId) {
        return res.status(400).json({
            success: false,
            message: "Session id required"
        });
    }

    try {
        const result = await createCoinRzpOrderService(sessionId, req.user!.id);
        return res.status(201).json({
            success: true,
            message: "Order created successfully",
            data: result
        });
    }
    catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export const verifyCoinRazorPayment = async (req: AuthenticatedRequest, res: Response) => {
    const { sessionId, orderId, paymentId, signature } = req.body;

    try {
        const result = await verifyCoinRzpPaymentService (
            sessionId,
            req.user!.id,
            orderId,
            paymentId,
            signature
        );

        return res.status(200).json({
            success: true,
            message: "Payment successfully verified",
            data: result
        });
    }
    catch (error: any) {
        return res.status(400).json({
            success: false,
            message: error.message || "Something went wrong"
        });
    }
};

export const failedCoinRazorPayment = async (req: AuthenticatedRequest, res: Response) =>{
    const { sessionId, razorpay_order_id: orderId, razorpay_payment_id: paymentId, reason } = req.body;
    try {
        const result = await failedCoinRzpPaymentService(
            req.user!.id,
            sessionId,
            orderId,
            paymentId,
            reason
        );
        return res.status(200).json({
            success: true,
            message: "Payment failed",
            data: result
        });
    }
    catch(error: any) {
        return res.status(500).json({
            success: false,
            message: error.message || "Server error",
        });
    }
}

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
