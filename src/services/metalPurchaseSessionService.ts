import prisma from "../config/db";
import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";
import { getCurrentGstRate, getCurrentGstRateWhole } from "./gstService";
import { getOrCreateTestWallet } from "./testWalletService";
import { allocateToGoals } from "./goldGoalService.js";

export const initiateMetalPurchaseSessionService = async (
    userId: string,
    metalType: "GOLD" | "SILVER",
    transactionType: "BUY" | "SELL",
    metalGrams: number
) => {
    if (!metalGrams || metalGrams <= 0) {
        throw new Error("Invalid metal grams");
    }

    if (metalGrams > 1000) {
        throw new Error("Exceeds max limit");
    }

    let ratePerGram;

    if (metalType === "GOLD") {
        const rate = await getCurrentGoldRate();
        ratePerGram = transactionType === "BUY" ? rate.buyRate : rate.sellRate;
    } else if (metalType === "SILVER") {
        const rate = await getCurrentSilverRate();
        ratePerGram = transactionType === "BUY" ? rate.buyRate : rate.sellRate;
    }

    const totalAmount = metalGrams * ratePerGram;
    const gstMultiplier = await getCurrentGstRate();
    const gstRateWhole = await getCurrentGstRateWhole();
    const gst = transactionType === "BUY" ? totalAmount * gstMultiplier : 0;
    const finalAmount = transactionType === "BUY" ? totalAmount + gst : totalAmount;

    const session = await prisma.$transaction(async (tx) => {
        await tx.metalPurchaseSession.updateMany({
            where: { user_id: userId, status: "ACTIVE" },
            data: { status: "EXPIRED" }
        });

        const newSession = await tx.metalPurchaseSession.create({
            data: {
                user_id: userId,
                status: "ACTIVE",
                expires_at: new Date(Date.now() + 5 * 60 * 1000),
                metalType,
                transactionType,
                metalGrams,
                locked_rate: ratePerGram,
                totalAmount,
                gst,
                gstRate: gstRateWhole,
                finalAmount
            }
        });

        return newSession;
    });

    return { session };
};

export const executeMetalPurchaseService = async (
    userId: string,
    sessionId: string,
    paymentMode: "WALLET" | "UPI" | "RAZORPAY" = "WALLET",
    storageType: string = "vault"
) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) {
        throw new Error("Invalid or inactive session");
    }

    if (new Date() > session.expires_at) {
        await prisma.metalPurchaseSession.update({
            where: { id: session.id },
            data: { status: "EXPIRED" }
        });
        throw new Error("Session has expired");
    }

    const { metalType, transactionType, metalGrams, finalAmount } = session;

    if (transactionType === "BUY") {
        const testWallet = await prisma.testWallet.findUnique({ where: { userId } });
        if (!testWallet || testWallet.virtualBalance < finalAmount) {
            throw new Error("Insufficient test wallet balance");
        }
    }
    else if (transactionType === "SELL") {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) {
            throw new Error("Wallet not found");
        }
        const balance = metalType === "GOLD" ? wallet.goldBalance : wallet.silverBalance;
        if (balance < metalGrams) {
            throw new Error(`Insufficient ${metalType.toLowerCase()} balance`);
        }
    }

    const result = await prisma.$transaction(async (tx) => {
        await tx.metalPurchaseSession.update({
            where: { id: sessionId },
            data: { status: "COMPLETED" }
        });

        let wallet = await tx.wallet.findUnique({ where: { userId: userId } });
        if (!wallet) {
            wallet = await tx.wallet.create({
                data: { userId, goldBalance: 0, silverBalance: 0, rupeeBalance: 0 }
            });
        }

        if (metalType === "GOLD") {
            await tx.wallet.update({
                where: { userId },
                data: {
                    goldBalance: transactionType === "BUY" ?
                        { increment: metalGrams } :
                        { decrement: metalGrams }
                }
            });
        }
        else if (metalType === "SILVER") {
            await tx.wallet.update({
                where: { userId },
                data: {
                    silverBalance: transactionType === "BUY" ?
                        { increment: metalGrams } :
                        { decrement: metalGrams }
                }
            });
        }

        if (transactionType === "BUY") {
            await getOrCreateTestWallet(tx, userId);
            await tx.testWallet.update({
                where: { userId: userId },
                data: { virtualBalance: { decrement: finalAmount } }
            });
        }

        const transaction = await tx.metalTransaction.create({
            data: {
                user_id: userId,
                session_id: sessionId,
                metalType,
                transactionType,
                metalGrams,
                ratePerGram: session.locked_rate,
                totalAmount: session.totalAmount,
                gst: session.gst,
                gstRate: session.gstRate,
                finalAmount: session.finalAmount,
                paymentMode,
                status: transactionType === "BUY" ? "COMPLETED" : "PENDING",
                storageType
            }
        });

        return transaction;
    });

    let goalAllocationResult;
    if(metalType === "GOLD" && transactionType === "BUY") {
        try {
            goalAllocationResult = await allocateToGoals(userId, metalGrams, session.totalAmount);
        }
        catch(error) {
            console.error("Goal allocation failed: (non-critical, it doesn't affect original purchase in any way)")
        }
    }

    return { result, goalAllocationResult };
};

export const cancelMetalPurchaseSessionService = async (userId: string, sessionId: string) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) {
        throw new Error("No active session found to cancel");
    }

    await prisma.metalPurchaseSession.update({
        where: { id: sessionId },
        data: { status: "CANCELLED" }
    });

    return { cancelled: true, sessionId };
};

export const getActiveSessionService = async (userId: string) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { user_id: userId, status: "ACTIVE" },
        orderBy: { started_at: "desc" }
    });

    if (!session) {
        return { session: null, reason: "none" as const };
    }

    if (session.expires_at <= new Date()) {
        await prisma.metalPurchaseSession.update({
            where: { id: session.id },
            data: { status: "EXPIRED" }
        });
        return { session: null, reason: "expired" as const };
    }

    return { session, reason: "active" as const };
};