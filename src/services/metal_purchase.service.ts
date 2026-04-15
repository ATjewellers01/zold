import prisma from "../config/db.js";
import { razorpay } from "../config/razorpay.js";
import { createHmac } from "crypto";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metal_rate.service.js";
import { getCurrentGstRate, getCurrentGstRateWhole } from "./gst.service.js";
import { allocateToGoals } from "./metal_goal.service.js";

export const initiateMetalPurchaseSessionService = async (
    userId: string,
    metalType: "GOLD" | "SILVER",
    transactionType: "BUY" | "SELL",
    metalGrams: number
) => {
    if (!metalGrams || metalGrams <= 0) throw new Error("Invalid metal grams");
    if (metalGrams > 1000) throw new Error("Exceeds max limit");

    // For SELL: verify sufficient balance before locking a session
    if (transactionType === "SELL") {
        const inventory = await prisma.inventory.findUnique({ where: { userId } });
        const balance = parseFloat(String(
            metalType === "GOLD" ? (inventory?.goldBalance ?? 0) : (inventory?.silverBalance ?? 0)
        ));
        if (balance < metalGrams) {
            throw new Error(
                `Insufficient ${metalType.toLowerCase()} balance. Available: ${balance.toFixed(3)}g, requested: ${metalGrams.toFixed ? metalGrams.toFixed(3) : metalGrams}g`
            );
        }
    }

    let ratePerGram: number;
    if (metalType === "GOLD") {
        const rate = await getCurrentGoldRate();
        ratePerGram = parseFloat(String(transactionType === "BUY" ? rate.buyRate : rate.sellRate));
    } else {
        const rate = await getCurrentSilverRate();
        ratePerGram = parseFloat(String(transactionType === "BUY" ? rate.buyRate : rate.sellRate));
    }

    if (!ratePerGram || ratePerGram <= 0) throw new Error("Metal rates unavailable");

    const totalAmount = metalGrams * ratePerGram;
    const gstMultiplier = await getCurrentGstRate();
    const gstRateWhole = await getCurrentGstRateWhole();
    // GST never applies to SELL transactions
    const gst = transactionType === "BUY" ? totalAmount * gstMultiplier : 0;
    const finalAmount = totalAmount + gst;

    const existSession = await prisma.metalPurchaseSession.findFirst({
        where: { user_id: userId, status: "ACTIVE" }
    });

    if (existSession) {
        const isExpired = new Date() > existSession.expires_at;

        if (!isExpired) {
            // Active session exists — reuse it. One user → one session → one Razorpay order max.
            return { session: existSession, reused: true };
        }

        // Session expired — mark it and fall through to create a new one
        await prisma.metalPurchaseSession.update({
            where: { id: existSession.id },
            data: { status: "EXPIRED" }
        });
    }

    const newSession = await prisma.metalPurchaseSession.create({
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

    return { session: newSession, reused: false };
};

export const createMetalRzpOrderService = async (
    userId: string,
    sessionId: string,
) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) throw new Error("Invalid or inactive session");

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
        };
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
    } catch (error) {
        console.log("Razorpay order creation failed", error);
        throw new Error("Payment gateway unavailable. Please try again");
    }
};

export const verifyMetalRzpPaymentService = async (
    userId: string,
    sessionId: string,
    orderId: string,
    paymentId: string,
    signature: string
) => {
    // Verify HMAC signature first — reject tampered requests before any DB work
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (expected !== signature) {
        throw new Error("Invalid transaction");
    }

    // Idempotency: if this payment was already processed, return existing records
    const completedSession = await prisma.metalPurchaseSession.findFirst({
        where: {
            id: sessionId,
            user_id: userId,
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            status: "COMPLETED"
        }
    });

    if (completedSession) {
        const [transaction, inventory] = await Promise.all([
            prisma.metalTransaction.findFirst({
                where: {
                    user_id: userId,
                    id: sessionId,
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    status: "COMPLETED"
                }
            }),
            prisma.inventory.findUnique({ where: { userId } })
        ]);
        return { session: completedSession, transaction, inventory };
    }

    const paymentSession = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!paymentSession || paymentSession.razorpay_order_id !== orderId) {
        throw new Error("Invalid transaction");
    }

    const verifiedPayment = await prisma.$transaction(async (tx) => {
        
        const updateResult = await tx.metalPurchaseSession.updateMany({
            where: {
                id: paymentSession.id,
                user_id: userId,
                razorpay_order_id: orderId,
                status: "ACTIVE"
            },
            data: {
                razorpay_payment_id: paymentId,
                status: "COMPLETED"
            }
        });

        if (updateResult.count === 0) {
            throw new Error("Already processed");
        }

        const transaction = await tx.metalTransaction.create({
            data: {
                user_id: userId,
                metalType: paymentSession.metalType,
                transactionType: paymentSession.transactionType,
                metalGrams: paymentSession.metalGrams,
                ratePerGram: paymentSession.locked_rate,
                totalAmount: paymentSession.totalAmount,
                gst: paymentSession.gst,
                finalAmount: paymentSession.finalAmount,
                paymentMode: "RAZORPAY",
                status: "COMPLETED",
                purchaseRate: paymentSession.locked_rate,
                gstRate: paymentSession.gstRate,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature
            }
        });

        let inventory;
        if (paymentSession.metalType === "GOLD") {
            inventory = await tx.inventory.upsert({
                where: { userId },
                create: { userId, goldBalance: paymentSession.metalGrams },
                update: { goldBalance: { increment: paymentSession.metalGrams } }
            });
        } else {
            inventory = await tx.inventory.upsert({
                where: { userId },
                create: { userId, silverBalance: paymentSession.metalGrams },
                update: { silverBalance: { increment: paymentSession.metalGrams } }
            });
        }

        return {
            session: { ...paymentSession, status: "COMPLETED" as const, razorpay_payment_id: paymentId },
            transaction,
            inventory
        };
    });

    if (paymentSession.transactionType === "BUY") {
        await allocateToGoals(
            userId,
            paymentSession.metalType,
            Number(paymentSession.metalGrams),
            Number(paymentSession.totalAmount)
        ).catch(e => console.error("Goal allocation failed:", e));
    }

    return verifiedPayment;
};

export const executeMetalSellService = async (userId: string, sessionId: string) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE", transactionType: "SELL" }
    });

    if (!session) throw new Error("No active sell session found");

    if (new Date() > session.expires_at) {
        await prisma.metalPurchaseSession.update({
            where: { id: session.id },
            data: { status: "EXPIRED" }
        });
        throw new Error("Session has expired");
    }

    return await prisma.$transaction(async (tx) => {
        // Atomic guard: prevent double execution
        const updateResult = await tx.metalPurchaseSession.updateMany({
            where: { id: session.id, user_id: userId, status: "ACTIVE" },
            data: { status: "COMPLETED" }
        });

        if (updateResult.count === 0) {
            throw new Error("Session already processed");
        }

        // Final balance guard — prevents negative balance if two concurrent sell
        // sessions somehow both passed the initiate-time check
        const inventory = await tx.inventory.findUnique({ where: { userId } });
        const currentBalance = parseFloat(String(
            session.metalType === "GOLD" ? (inventory?.goldBalance ?? 0) : (inventory?.silverBalance ?? 0)
        ));
        if (currentBalance < parseFloat(String(session.metalGrams))) {
            throw new Error(`Insufficient ${session.metalType.toLowerCase()} balance`);
        }

        const transaction = await tx.metalTransaction.create({
            data: {
                user_id: userId,
                metalType: session.metalType,
                transactionType: "SELL",
                metalGrams: session.metalGrams,
                ratePerGram: session.locked_rate,
                totalAmount: session.totalAmount,
                gst: session.gst, // always 0 for SELL
                finalAmount: session.finalAmount,
                paymentMode: "WALLET",
                status: "PENDING", // sits pending until admin approves
                purchaseRate: session.locked_rate,
                gstRate: session.gstRate
            }
        });

        if (session.metalType === "GOLD") {
            await tx.inventory.update({
                where: { userId },
                data: { goldBalance: { decrement: session.metalGrams } }
            });
        } else {
            await tx.inventory.update({
                where: { userId },
                data: { silverBalance: { decrement: session.metalGrams } }
            });
        }

        return {
            session: { ...session, status: "COMPLETED" as const },
            transaction
        };
    });
};

export const cancelMetalPurchaseSessionService = async (userId: string, sessionId: string) => {
    const session = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) {
        throw new Error("No active session found to cancel");
    }

    await prisma.metalPurchaseSession.update({
        where: { id: sessionId, user_id: userId },
        data: { status: "CANCELLED" }
    });

    return { cancelled: true, sessionId };
};

export const failedMetalRzpPaymentService = async (
    userId: string,
    sessionId: string,
    orderId: string,
    paymentId: string,
    reason: string
) => {
    const paymentSession = await prisma.metalPurchaseSession.findFirst({
        where: { id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!paymentSession || paymentSession.razorpay_order_id !== orderId) {
        throw new Error("Invalid transaction");
    }

    const transaction = await prisma.metalTransaction.create({
        data: {
            user_id: userId,
            id: sessionId,
            metalType: paymentSession.metalType,
            transactionType: paymentSession.transactionType,
            metalGrams: paymentSession.metalGrams,
            ratePerGram: paymentSession.locked_rate,
            totalAmount: paymentSession.totalAmount,
            gst: paymentSession.gst,
            finalAmount: paymentSession.finalAmount,
            paymentMode: "RAZORPAY",
            status: "FAILED",
            purchaseRate: paymentSession.locked_rate,
            gstRate: paymentSession.gstRate,
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: null,
            remark: reason
        }
    });

    return { session: paymentSession, transaction };
};

export const getMetalActiveSessionService = async (userId: string) => {
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
