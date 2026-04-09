import prisma from "../config/db.js"
import { razorpay } from "../config/razorpay.js";
import { createHmac, sign } from "crypto";
import { CoinTransaction } from "../../generated/prisma/index.js";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";
import { getCurrentGstRateWhole } from "./gstService.js";

export const addToPrimaryCartService = async (metalDetails, userId:string) => {
    const { gold, silver } = metalDetails;

    const cart = await prisma.cart.upsert({
        where: { user_id: userId },
        create: { user_id: userId },
        update: {}
    });

    const goldItems = Object.entries(gold?.weight ?? {}).map(([weightStr, value]) => {
        const { quantity } = value as { quantity: number };

        return {
            cart_id: cart.id,
            weight: parseInt(weightStr),
            quantity: quantity,
            metal: "GOLD" as const
        }
    });

    const silverItems = Object.entries(silver?.weight ?? {}).map(([weightStr, value]) => {
        const { quantity } = value as { quantity: number };

        return {
            cart_id: cart.id,
            weight: parseInt(weightStr),
            quantity: quantity,
            metal: "SILVER" as const
        }
    });

    const allItems = [...goldItems, ...silverItems];
    if(!allItems.length) throw new Error("Cart is empty");

    return await prisma.$transaction(async (tx) => {
        await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });
        await tx.cartItem.createMany({ data: allItems });
        
        return await tx.cartItem.findMany({ where: { cart_id: cart.id } });
    });
}

export const initiateCoinPurchaseSessionService = async (cartId, userId) => {
    const goldRate = await getCurrentGoldRate();
    const goldBuyRate = parseFloat(String(goldRate.buyRate));

    const silverRate = await getCurrentSilverRate();
    const silverBuyRate = parseFloat(String(silverRate.buyRate));

    if (!goldBuyRate || !silverBuyRate) {
        throw new Error("Metal rates are unavailable, try again later");
    }

    const gstRate = await getCurrentGstRateWhole();

    const result = await prisma.$transaction(async (tx) => {
        await tx.coinPurchaseSession.updateMany({
            where: { user_id: userId, status: "ACTIVE" },
            data: { status: "EXPIRED" }
        });

        const session = await tx.coinPurchaseSession.create({
            data: {
                user_id: userId,
                status: "ACTIVE",
                gstRate: gstRate,
                expires_at: new Date(Date.now() + 5 * 60 * 1000)
            }
        });

        const lockedCart = await tx.lockedCart.create({
            data: {
                session_id: session.session_id,
                user_id: userId,
                locked_at: new Date(),
                gold_locked_price: goldBuyRate,
                silver_locked_price: silverBuyRate,
                gstRate: gstRate
            }
        });

        const cartItems = await tx.cartItem.findMany({ where: { cart_id: cartId } });
        if(!cartItems.length) {
            throw new Error("Cart is empty");
        }

        const lockedCartItems = cartItems.map((item) => {
            return {
                locked_cart_id: lockedCart.id,
                weight: item.weight,
                quantity: item.quantity,
                metal: item.metal,
                item_price: item.weight * (item.metal === "GOLD" ?
                    goldBuyRate : silverBuyRate) * item.quantity
            }
        });

        await tx.lockedCartItem.createMany({ data: lockedCartItems });

        return { session, lockedCart, lockedCartItems };
    });

    return result;
};

export const createCoinRzpOrderService = async (sessionId: string, userId: string) => {
    const session = await prisma.coinPurchaseSession.findUnique({
        where: { session_id: sessionId },
        include: {
            lockedCart: {
                include: {
                    items: true
                }
            }
        }
    });

    if (!session || session.user_id !== userId) {
        throw new Error("Invalid session");
    }

    if (session.status !== "ACTIVE") {
        throw new Error(`Session is ${session.status.toLowerCase()}`);
    }

    if(session.razorpay_order_id) {
        return {
            orderId: session.razorpay_order_id,
            paymentId: session.razorpay_payment_id,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            sessionId
        }
    }

    if (new Date() > session.expires_at) {
        await prisma.coinPurchaseSession.update({
            where: { session_id: session.session_id },
            data: { status: "EXPIRED" }
        })
        throw new Error("Session expired");
    }

    const lockedCart = session.lockedCart;
    if (!lockedCart || !lockedCart.items.length) {
        throw new Error("Cart is empty");
    }

    const gstMultiplier = Number(session.gstRate) / 100;

    let totalToDeduct = 0;
    lockedCart.items.forEach(item => {
        const itemBasePrice = Number(item.item_price);
        const itemGst = itemBasePrice * gstMultiplier;
        totalToDeduct += (itemBasePrice + itemGst);
    });

    try {
        const order = await razorpay.orders.create({
            amount: Math.round(Number(totalToDeduct) * 100),
            currency: "INR",
            receipt: session.session_id,
        });

        await prisma.coinPurchaseSession.update({
            where: {
                session_id: sessionId,
                user_id: userId,
                status: "ACTIVE"
            },
            data: { razorpay_order_id: order.id }
        });

        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
            sessionId
        }
    }
    catch (error) {
        console.log("Razorpay order creation failed", error);
        throw new Error("Payment gateway unavailable. Please try again");
    }
};

export const verifyCoinRzpPaymentService = async (
    sessionId: string,
    userId: string, 
    orderId: string, 
    paymentId: string, 
    signature: string
) => {

    const session = await prisma.coinPurchaseSession.findFirst({
        where: {
            razorpay_payment_id: paymentId, status: "COMPLETED"
        }
    });

    if(session) {
        const [transaction, inventory] = await Promise.all([
            prisma.coinTransaction.findFirst({
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

        return { session, transaction, inventory }
    }

    const paymentSession = await prisma.coinPurchaseSession.findFirst({
        where: { session_id: sessionId, user_id: userId, status: "ACTIVE" },
        include: { lockedCart: { include: { items: true } } }
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

    const lockedCart = paymentSession.lockedCart;
    if (!lockedCart || !lockedCart.items.length) {
        throw new Error("Locked cart missing");
    }

    const gstMultiplier = Number(paymentSession.gstRate) / 100;

    const verifiedPayment = await prisma.$transaction(async (tx) => {
        const updatedSession = await tx.coinPurchaseSession.update({
            where: {
                session_id: sessionId,
                user_id: userId,
                razorpay_order_id: orderId
            },
            data: {
                status: "COMPLETED",
                razorpay_payment_id: paymentId
            }
        });

        const transactions: CoinTransaction[] = [];
        for (const item of lockedCart.items) {
            const ratePerGram = item.metal === "GOLD"
                ? Number(lockedCart.gold_locked_price)
                : Number(lockedCart.silver_locked_price);
            const basePrice = Number(item.item_price);
            const gst = basePrice * gstMultiplier;
            const finalAmount = basePrice + gst;

            const transaction = await tx.coinTransaction.create({
                data: {
                    user_id: userId,
                    session_id: sessionId,
                    metal: item.metal,
                    type: "BUY",
                    weight: item.weight,
                    quantity: item.quantity,
                    rate_per_gram: ratePerGram,
                    gold_locked_price: lockedCart.gold_locked_price,
                    silver_locked_price: lockedCart.silver_locked_price,
                    gst,
                    gstRate: paymentSession.gstRate,
                    final_amount: finalAmount,
                    payment_mode: "RAZORPAY",
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    razorpay_signature: signature,
                    status: "COMPLETED"
                }
            });
            transactions.push(transaction);

            await tx.coinInventory.upsert({
                where: {
                    userId_coinGrams_metal: {
                        userId,
                        coinGrams: item.weight,
                        metal: item.metal
                    }
                },
                create: {
                    userId,
                    coinGrams: item.weight,
                    metal: item.metal,
                    quantity: item.quantity
                },
                update: { quantity: { increment: item.quantity } }
            });
        }

        return { session: updatedSession, transactions };
    });

    return verifiedPayment;
}

export const failedCoinRzpPaymentService = async (
    userId,
    sessionId,
    orderId,
    paymentId,
    reason
) => {
    const paymentSession = await prisma.coinPurchaseSession.findFirst({
        where: { session_id: sessionId, user_id: userId, status: "ACTIVE" },
        include: { lockedCart: { include: { items: true } } }
    });

    if (!paymentSession || paymentSession.razorpay_order_id !== orderId) {
        throw new Error("Invalid transaction");
    }

    const lockedCart = paymentSession.lockedCart;
    if (!lockedCart || !lockedCart.items.length) {
        throw new Error("Locked cart missing");
    }

    const gstMultiplier = Number(paymentSession.gstRate) / 100;

    // Session stays ACTIVE — user can retry payment within the 5-minute window
    const failedPayment = await prisma.$transaction(async (tx) => {
        const updatedSession = paymentSession;

        const transactions: CoinTransaction[] = [];
        for (const item of lockedCart.items) {
            const ratePerGram = item.metal === "GOLD"
                ? Number(lockedCart.gold_locked_price)
                : Number(lockedCart.silver_locked_price);
            const basePrice = Number(item.item_price);
            const gst = basePrice * gstMultiplier;
            const finalAmount = basePrice + gst;

            const transaction = await tx.coinTransaction.create({
                data: {
                    user_id: userId,
                    session_id: sessionId,
                    metal: item.metal,
                    type: "BUY",
                    weight: item.weight,
                    quantity: item.quantity,
                    rate_per_gram: ratePerGram,
                    gold_locked_price: lockedCart.gold_locked_price,
                    silver_locked_price: lockedCart.silver_locked_price,
                    gst,
                    gstRate: paymentSession.gstRate,
                    final_amount: finalAmount,
                    payment_mode: "RAZORPAY",
                    razorpay_order_id: orderId,
                    razorpay_payment_id: paymentId,
                    razorpay_signature: null,
                    status: "FAILED",
                    remark: reason
                }
            });
            transactions.push(transaction);
        }

        return { session: updatedSession, transactions };
    });

    return failedPayment;
    
}

export const cancelCoinPurchaseSessionService = async (sessionId: string, userId: string) => {
    const session = await prisma.coinPurchaseSession.findFirst({
        where: { session_id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) {
        throw new Error("No active session found to cancel");
    }

    await prisma.coinPurchaseSession.update({
        where: { session_id: sessionId },
        data: { status: "CANCELLED" }
    });

    return { cancelled: true, sessionId };
};