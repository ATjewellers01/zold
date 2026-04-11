import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import {
    getUserTransactionsService,
    getUserSellTransactionHistoryService,
} from "../services/transaction_history.service.js";
import {
    approveSellTransactionService,
    rejectSellTransactionService,
} from "../services/sell_transaction.service.js";

export const getUserTransactionsHistory = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const targetUserId = (req.user!.role === "ADMIN" && req.query.userId)
            ? String(req.query.userId)
            : req.user!.id;
        const data = await getUserTransactionsService(targetUserId);
        return res.status(200).json({
            success: true,
            message: "User transactions fetched successfully",
            data,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

export const getUserSellTransactionHistory = async (_req: AuthenticatedRequest, res: Response) => {
    try {
        const data = await getUserSellTransactionHistoryService();
        return res.status(200).json({
            success: true,
            message: "Sell transaction history fetched successfully",
            data,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

export const approveSellTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { transactionId } = req.params;
        const adminId = req.user!.id;
        const result = await approveSellTransactionService(transactionId, adminId);
        return res.status(200).json({
            success: true,
            message: "Sell transaction approved",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const rejectSellTransaction = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { transactionId } = req.params;
        const { remark } = req.body;
        const adminId = req.user!.id;
        const result = await rejectSellTransactionService(transactionId, remark, adminId);
        return res.status(200).json({
            success: true,
            message: "Sell transaction rejected",
            data: result,
        });
    } catch (error: any) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
