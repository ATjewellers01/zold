import prisma from "../config/db.js";
import { razorpay } from "../config/razorpay.js";
import { createHmac } from "crypto";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";
import { getCurrentGstRate, getCurrentGstRateWhole } from "./gstService.js";

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

    if (!ratePerGram || ratePerGram <= 0) {
        throw new Error(`${metalType} rate unavailable`)
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

export const createRazorpayOrderService = async (
    userId: string,
    sessionId: string,
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

    if (session.transactionType !== "BUY") {
        throw new Error("SELL flow does not use Razorpay");
    }

    if (session.razorpay_order_id) {
        return {
            orderId: session.razorpay_order_id,
            amount: Math.round(Number(session.finalAmount) * 100),
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            sessionId
        }
    }

    try {
        const order = await razorpay.orders.create({
            amount: Math.round(Number(session.finalAmount) * 100),
            currency: "INR",
            receipt: session.id
        });

        await prisma.metalPurchaseSession.update({
            where: { id: session.id },
            data: { razorpay_order_id: order.id }
        });

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            sessionId
        };
    }
    catch (error) {
        console.log("Razorpay order creation failed", error);
        throw new Error("Payment gateway unavailable. Please try again");
    }
};

export const verifyRazorpayPaymentService = async (
    userId: string,
    sessionId: string,
    orderId: string,
    paymentId: string,
    signature: string
) => {

    const session = await prisma.metalPurchaseSession.findFirst({
        where: { razorpay_payment_id: paymentId, status: "COMPLETED" }
    });

    if (session) {
        const [transaction, inventory] = await Promise.all([
            prisma.metalTransaction.findFirst({
                where: {
                    user_id: userId,
                    session_id: sessionId,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    status: "COMPLETED"
                }
            }),

            prisma.inventory.findUnique({
                where: { userId }
            })
        ]);

        return { session, transaction, inventory };
    }

    const paymentSession = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (paymentSession?.razorpay_order_id !== orderId) {
        throw new Error("Invalid transaction");
    }

    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (expected !== signature) {
        throw new Error("Invalid transaction");
    }

    const verifiedPayment = await prisma.$transaction(async (tx) => {
        const session = await tx.metalPurchaseSession.update({
            where: {
                id: paymentSession!.id,
                user_id: paymentSession!.user_id,
                razorpay_order_id: orderId,
            },
            data: {
                razorpay_payment_id: paymentId,
                status: "COMPLETED"
            }
        });

        const transaction = await tx.metalTransaction.create({
            data: {
                user_id: userId,
                session_id: session.id,
                metalType: session.metalType,
                transactionType: session.transactionType,
                metalGrams: session.metalGrams,
                ratePerGram: session.locked_rate,
                totalAmount: session.totalAmount,
                gst: session.gst,
                finalAmount: session.finalAmount,
                paymentMode: "RAZORPAY",
                status: "COMPLETED",
                purchaseRate: session.locked_rate,
                gstRate: session.gstRate,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature
            }
        });

        let inventory;
        if (transaction.metalType === "GOLD") {
            inventory = await tx.inventory.upsert({
                where: { userId },
                create: {
                    userId,
                    goldBalance: transaction.metalGrams
                },
                update: { goldBalance: { increment: transaction.metalGrams } }
            });
        }
        else if (transaction.metalType === "SILVER") {
            inventory = await tx.inventory.upsert({
                where: { userId },
                create: {
                    userId,
                    silverBalance: transaction.metalGrams
                },
                update: { silverBalance: { increment: transaction.metalGrams } }
            });
        }

        return { session, transaction, inventory };
    });

    return verifiedPayment;
}

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