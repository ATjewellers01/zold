import prisma from "../config/db.js"
import { razorpay } from "../config/razorpay.js";
import { createHmac } from "crypto";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metal_rate.service.js";
import { getCurrentGstRateWhole } from "./gst.service.js";

export const createSipService = async (
    name: string,
    type: "REGULAR",
    metal: "GOLD" | "SILVER",
    minInvestment: number
) => {
    const sip = await prisma.sip.create({
        data: {
            name,
            type: type,
            metal,
            min_investment: minInvestment
        }
    });

    return sip;
};

export const getSipService = async () => {
    return await prisma.sip.findMany({});
};

export const createSipRzpOrder = async (
    userId: string,
    sipId: string,
    name: string,
    metal: "GOLD" | "SILVER",
    amount: number,
    day_of_month: number,
) => {

    const goldPrice = await getCurrentGoldRate();
    const silverPrice = await getCurrentSilverRate();

    if (metal === "GOLD" && goldPrice.buyRate <= 0) {
        throw new Error("Gold rate unavailable");
    }
    if (metal === "SILVER" && silverPrice.buyRate <= 0) {
        throw new Error("Silver rate unavailable");
    }

    const gstRate = await getCurrentGstRateWhole();
    const gstAmount = (gstRate / 100) * amount;
    const totalAmount = amount + gstAmount;

    const order = await razorpay.orders.create({
        amount: Math.round(Number(totalAmount) * 100),
        currency: "INR",
        receipt: `reciept_sip${Date.now()}`
    });

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keyId: process.env.RAZORPAY_KEY_ID,
        sipDetails: {
            name,
            metal,
            amount,
            day_of_month,
        },
        orderDetails: {
            gstRate,
            gstAmount,
            totalAmount
        }
    };
};

export const verifySipTransaction = async (
    userId: string,
    sipId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    sipDetails,
    orderDetails
) => {
    // Verify HMAC signature first, if does not match, reject it
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (expected != signature) {
        throw new Error("Invalid transaction");
    }

    const existOrder = await prisma.sipTransaction.findMany({
        where: { user_id: userId, razorpay_order_id: orderId, razorpay_payment_id: paymentId }
    });

    // If there is already an order created with same orderId and paymentId,
    // payment already completed, return that order
    if (existOrder.length > 0) {
        return { order: existOrder, message: "Your transaction is already completed" };
    }

    // Update both, user's sip record and transaction record atomically
    const result = await prisma.$transaction(async (tx) => {
        const userSipRecord = await tx.userSip.upsert({
            where: {
                sip_id_user_id: {
                    sip_id: sipId, user_id: userId
                }
            },
            create: {
                sip_id: sipId,
                user_id: userId,
                metal: sipDetails.metal,
                investment_amount: sipDetails.amount,
                total_invested_amount: sipDetails.amount,
                day_of_month: sipDetails.day_of_month,
            },
            update: {
                investment_amount: sipDetails.amount,
                total_invested_amount: { increment: sipDetails.amount },
                day_of_month: sipDetails.day_of_month
            }
        });

        const sipTransactionRecord = await tx.sipTransaction.create({
            data: {
                sip_id: sipId,
                user_id: userId,
                gst: orderDetails.gstAmount,
                investment_amount: sipDetails.amount,
                metal: sipDetails.metal,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                total_amount: orderDetails.totalAmount,
                status: "COMPLETED"
            }
        });

        return { userSipRecord, sipTransactionRecord };
    });

    return result;
};

export const activeSipService = async (userId) => {
    return await prisma.userSip.findMany({
        where: { user_id: userId },
        include: { sip: { select: { name: true, type: true } } }
    });
};

// ── Top-up: one-time immediate purchase, adds metal to wallet

export const createTopupOrderService = async (
    userId: string,
    sipId: string,
    metal: "GOLD" | "SILVER",
    amount: number,
) => {
    const rate = metal === "GOLD" ? await getCurrentGoldRate() : await getCurrentSilverRate();
    if (rate.buyRate <= 0) throw new Error(`${metal} rate unavailable`);

    const gstRate = await getCurrentGstRateWhole();
    const gstAmount = (gstRate / 100) * amount;
    const totalAmount = amount + gstAmount;

    const order = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_topup_${Date.now()}`,
    });

    return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        topupDetails: { metal, amount, buyRate: rate.buyRate },
        orderDetails: { gstRate, gstAmount, totalAmount },
    };
};

export const verifyTopupService = async (
    userId: string,
    sipId: string,
    orderId: string,
    paymentId: string,
    signature: string,
    topupDetails: { metal: "GOLD" | "SILVER"; amount: number; buyRate: number },
    orderDetails: { gstRate: number; gstAmount: number; totalAmount: number },
) => {
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (expected !== signature) throw new Error("Invalid transaction");

    // Idempotency: don't double-credit if webhook fires twice
    const existing = await prisma.sipTransaction.findFirst({
        where: { razorpay_order_id: orderId, razorpay_payment_id: paymentId },
    });
    if (existing) return { transaction: existing, message: "Already completed" };

    const grams = topupDetails.amount / topupDetails.buyRate;
    const walletField = topupDetails.metal === "GOLD" ? "goldBalance" : "silverBalance";

    const result = await prisma.$transaction(async (tx) => {
        // Add grams to wallet
        await tx.inventory.update({
            where: { userId },
            data: { [walletField]: { increment: grams } },
        });

        // Increment total_invested on the UserSip (does NOT change recurring amount or day)
        await tx.userSip.update({
            where: { sip_id_user_id: { sip_id: sipId, user_id: userId } },
            data: { total_invested_amount: { increment: topupDetails.amount } },
        });

        // Record transaction
        return tx.sipTransaction.create({
            data: {
                sip_id: sipId,
                user_id: userId,
                metal: topupDetails.metal,
                investment_amount: topupDetails.amount,
                gst: orderDetails.gstAmount,
                total_amount: orderDetails.totalAmount,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                status: "COMPLETED",
            },
        });
    });

    return result;
};

// ── Modify SIP: update recurring amount and/or day, no payment ───────────────

export const modifySipService = async (
    userId: string,
    sipId: string,
    investment_amount?: number,
    day_of_month?: number,
) => {
    const userSip = await prisma.userSip.findUnique({
        where: { sip_id_user_id: { sip_id: sipId, user_id: userId } },
    });
    if (!userSip) throw new Error("SIP not found");

    if (day_of_month !== undefined && (day_of_month < 1 || day_of_month > 28)) {
        throw new Error("Day of month must be between 1 and 28");
    }

    const data: { investment_amount?: number; day_of_month?: number } = {};
    if (investment_amount !== undefined) data.investment_amount = investment_amount;
    if (day_of_month !== undefined) data.day_of_month = day_of_month;

    return await prisma.userSip.update({
        where: { sip_id_user_id: { sip_id: sipId, user_id: userId } },
        data,
    });
};