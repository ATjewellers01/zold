import prisma from "../config/db.js"
import { razorpay } from "../config/razorpay.js";
import { createHmac } from "crypto";
import { CoinTransaction, Metal, Prisma } from "../../generated/prisma/index.js";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";
import { getCurrentGstRateWhole } from "./gstService.js";

export const addCartItemService = async (
    userId: string, 
    weight: number, 
    metal: Metal, 
    quantity: number = 1
) => {
    const cart = await prisma.cart.upsert({
        where: { user_id: userId },
        create: { user_id: userId },
        update: {}
    });

    return await prisma.cartItem.upsert({
        where: { cart_id_weight_metal: { cart_id: cart.id, weight, metal } },
        create: { cart_id: cart.id, weight, metal, quantity },
        update: { quantity: { increment: quantity } }
    });
};

export const removeCartItemService = async (
    userId: string,
    weight: number,
    metal: Metal,
    quantity: number = 1,
    removeAll: boolean = false
) => {
    const cart = await prisma.cart.findUnique({ where: { user_id: userId } });
    if (!cart) throw new Error("Cart not found");

    const item = await prisma.cartItem.findUnique({
        where: { cart_id_weight_metal: { cart_id: cart.id, weight, metal } }
    });
    if (!item) throw new Error("Item not in cart");

    if (removeAll || item.quantity <= quantity) {
        return await prisma.cartItem.delete({
            where: { cart_id_weight_metal: { cart_id: cart.id, weight, metal } }
        });
    }

    return await prisma.cartItem.update({
        where: { cart_id_weight_metal: { cart_id: cart.id, weight, metal } },
        data: { quantity: { decrement: quantity } }
    });
};

export const initiateCoinPurchaseSessionService = async (userId: string) => {
    const cart = await prisma.cart.findUnique({
        where: { user_id: userId },
        include: { items: true }
    });

    if (!cart || !cart.items.length) {
        throw new Error("Cart is empty");
    }

    const existSession = await prisma.coinPurchaseSession.findFirst({
        where: { user_id: userId, status: "ACTIVE" },
        include: { lockedCart: { include: { items: true } } }
    });

    if (existSession) {
        const isExpired = new Date() > existSession.expires_at;

        if (!isExpired) {
            // Razorpay order already created — amount is locked, return as-is.
            // The user must complete or wait for expiry before cart changes take effect.
            if (existSession.razorpay_order_id) {
                return {
                    session: existSession,
                    lockedCart: existSession.lockedCart,
                    lockedCartItems: existSession.lockedCart?.items ?? []
                };
            }

            const cartHash = cart.items
                .map(i => `${i.metal}:${i.weight}:${i.quantity}`)
                .sort().join("|");
            const lockedHash = existSession.lockedCart?.items
                .map(i => `${i.metal}:${i.weight}:${i.quantity}`)
                .sort().join("|") ?? "";

            // Cart unchanged — reuse session as-is, no DB writes needed
            if (cartHash === lockedHash) {
                return {
                    session: existSession,
                    lockedCart: existSession.lockedCart,
                    lockedCartItems: existSession.lockedCart?.items ?? []
                };
            }

            // Cart changed, no Razorpay order yet — update locked cart with fresh prices.
            // We keep the same session and session_id so only one Razorpay order
            // can ever be created, preventing double payment entirely.
            const goldRate = await getCurrentGoldRate();
            const goldBuyRate = parseFloat(String(goldRate.buyRate));
            const silverRate = await getCurrentSilverRate();
            const silverBuyRate = parseFloat(String(silverRate.buyRate));

            if (!goldBuyRate || !silverBuyRate) {
                throw new Error("Metal rates are unavailable, try again later");
            }

            const gstRate = await getCurrentGstRateWhole();

            const updateResult = await prisma.$transaction(async (tx) => {
                // Atomic guard: if a Razorpay order was created between our check
                // above and this update, abort — amount is now locked on Razorpay's side.
                const guard = await tx.coinPurchaseSession.updateMany({
                    where: { session_id: existSession.session_id, razorpay_order_id: null },
                    data: { gstRate }
                });

                if (guard.count === 0) {
                    return null; // order created concurrently
                }

                const updatedLockedCart = await tx.lockedCart.update({
                    where: { session_id: existSession.session_id },
                    data: { gold_locked_price: goldBuyRate, silver_locked_price: silverBuyRate, gstRate }
                });

                await tx.lockedCartItem.deleteMany({ where: { locked_cart_id: updatedLockedCart.id } });

                const lockedCartItems = cart.items.map(item => ({
                    locked_cart_id: updatedLockedCart.id,
                    weight: item.weight,
                    quantity: item.quantity,
                    metal: item.metal,
                    item_price: item.weight * (item.metal === "GOLD" ? goldBuyRate : silverBuyRate) * item.quantity
                }));

                await tx.lockedCartItem.createMany({ data: lockedCartItems });

                return { lockedCart: updatedLockedCart, lockedCartItems };
            });

            if (!updateResult) {
                // Razorpay order was created concurrently — return existing session as-is
                return {
                    session: existSession,
                    lockedCart: existSession.lockedCart,
                    lockedCartItems: existSession.lockedCart?.items ?? []
                };
            }

            return {
                session: { ...existSession, gstRate },
                lockedCart: updateResult.lockedCart,
                lockedCartItems: updateResult.lockedCartItems
            };
        }

        // Session expired — mark it and fall through to create a new one
        await prisma.coinPurchaseSession.update({
            where: { session_id: existSession.session_id },
            data: { status: "EXPIRED" }
        });
    }

    // No active session (or just expired) — create a fresh one
    const goldRate = await getCurrentGoldRate();
    const goldBuyRate = parseFloat(String(goldRate.buyRate));
    const silverRate = await getCurrentSilverRate();
    const silverBuyRate = parseFloat(String(silverRate.buyRate));

    if (!goldBuyRate || !silverBuyRate) {
        throw new Error("Metal rates are unavailable, try again later");
    }

    const gstRate = await getCurrentGstRateWhole();

    try {
        const result = await prisma.$transaction(async (tx) => {
            const session = await tx.coinPurchaseSession.create({
                data: {
                    user_id: userId,
                    status: "ACTIVE",
                    gstRate,
                    expires_at: new Date(Date.now() + 5 * 60 * 1000)
                }
            });

            const lockedCart = await tx.lockedCart.create({
                data: {
                    session_id: session.session_id,
                    user_id: userId,
                    gold_locked_price: goldBuyRate,
                    silver_locked_price: silverBuyRate,
                    gstRate
                }
            });

            const lockedCartItems = cart.items.map(item => ({
                locked_cart_id: lockedCart.id,
                weight: item.weight,
                quantity: item.quantity,
                metal: item.metal,
                item_price: item.weight * (item.metal === "GOLD" ? goldBuyRate : silverBuyRate) * item.quantity
            }));

            await tx.lockedCartItem.createMany({ data: lockedCartItems });

            return { session, lockedCart, lockedCartItems };

        // Serializable isolation prevents two concurrent requests (both finding no
        // existing session) from both successfully creating a new session.
        // PostgreSQL's SSI detects the read-write conflict cycle and aborts one.
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

        return result;

    } catch (error: any) {
        // P2034 = Prisma serialization failure (concurrent session creation race).
        // One of the two concurrent requests lost — tell the client to retry.
        if (error?.code === "P2034") {
            throw new Error("Session conflict detected. Please try again.");
        }
        throw error;
    }
};

export const createCoinRzpOrderService = async (sessionId: string, userId: string) => {
    const session = await prisma.coinPurchaseSession.findUnique({
        where: { session_id: sessionId },
        include: { lockedCart: { include: { items: true } } }
    });

    if (!session || session.user_id !== userId) {
        throw new Error("Invalid session");
    }

    if (session.status !== "ACTIVE") {
        throw new Error(`Session is ${session.status.toLowerCase()}`);
    }

    if (new Date() > session.expires_at) {
        await prisma.coinPurchaseSession.update({
            where: { session_id: session.session_id },
            data: { status: "EXPIRED" }
        });
        throw new Error("Session is expired");
    }

    const lockedCart = session.lockedCart;
    if (!lockedCart || !lockedCart.items.length) {
        throw new Error("Cart is empty");
    }

    const gstMultiplier = Number(session.gstRate) / 100;
    let totalToDeduct = 0;
    lockedCart.items.forEach(item => {
        const base = Number(item.item_price);
        totalToDeduct += base + base * gstMultiplier;
    });

    const amountInPaise = Math.round(totalToDeduct * 100);

    if (session.razorpay_order_id) {
        return {
            orderId: session.razorpay_order_id,
            amount: amountInPaise,
            currency: "INR",
            keyId: process.env.RAZORPAY_KEY_ID,
            sessionId
        };
    }

    try {
        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: session.session_id,
        });

        await prisma.coinPurchaseSession.update({
            where: { session_id: sessionId, user_id: userId, status: "ACTIVE" },
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

export const verifyCoinRzpPaymentService = async (
    sessionId: string,
    userId: string,
    orderId: string,
    paymentId: string,
    signature: string
) => {
    const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

    if (expected !== signature) {
        throw new Error("Invalid transaction");
    }

    const completedSession = await prisma.coinPurchaseSession.findFirst({
        where: { razorpay_payment_id: paymentId, status: "COMPLETED", user_id: userId }
    });

    if (completedSession) {
        const transaction = await prisma.coinTransaction.findFirst({
            where: {
                user_id: userId,
                session_id: completedSession.session_id,
                razorpay_order_id: orderId,
                razorpay_payment_id: paymentId,
                status: "COMPLETED"
            }
        });
        return { session: completedSession, transaction };
    }

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

    const verifiedPayment = await prisma.$transaction(async (tx) => {

        const updateResult = await tx.coinPurchaseSession.updateMany({
            where: {
                session_id: sessionId,
                user_id: userId,
                razorpay_order_id: orderId,
                status: "ACTIVE"
            },
            data: { status: "COMPLETED", razorpay_payment_id: paymentId }
        });

        if (updateResult.count === 0) {
            throw new Error("Session already processed");
        }

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
                where: { userId_coinGrams_metal: { userId, coinGrams: item.weight, metal: item.metal } },
                create: { userId, coinGrams: item.weight, metal: item.metal, quantity: item.quantity },
                update: { quantity: { increment: item.quantity } }
            });
        }

        return { transactions };
    });

    return verifiedPayment;
};

export const failedCoinRzpPaymentService = async (
    userId: string,
    sessionId: string,
    orderId: string,
    paymentId: string,
    reason: string
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

    const transactions: CoinTransaction[] = [];
    await prisma.$transaction(async (tx) => {
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
    });

    return { session: paymentSession, transactions };
};

export const getActiveCoinSessionService = async (userId: string) => {
    const session = await prisma.coinPurchaseSession.findFirst({
        where: { user_id: userId, status: "ACTIVE" },
        include: { lockedCart: { include: { items: true } } }
    });

    if (!session) {
        return { session: null, lockedCart: null, lockedCartItems: [], reason: "none" as const };
    }

    if (session.expires_at <= new Date()) {
        await prisma.coinPurchaseSession.update({
            where: { session_id: session.session_id },
            data: { status: "EXPIRED" }
        });
        return { session: null, lockedCart: null, lockedCartItems: [], reason: "expired" as const };
    }

    return {
        session,
        lockedCart: session.lockedCart,
        lockedCartItems: session.lockedCart?.items ?? [],
        reason: "active" as const
    };
};

export const cancelCoinPurchaseSessionService = async (sessionId: string, userId: string) => {
    const session = await prisma.coinPurchaseSession.findFirst({
        where: { session_id: sessionId, user_id: userId, status: "ACTIVE" }
    });

    if (!session) {
        throw new Error("No active session found to cancel");
    }

    // Once a Razorpay order exists, cancelling our session does NOT cancel the
    // order on Razorpay's side. The payment can still go through, causing money
    // to be deducted with no transaction record. Block cancellation.
    if (session.razorpay_order_id) {
        throw new Error("Cannot cancel a session with an active payment. Close the payment window first.");
    }

    await prisma.coinPurchaseSession.update({
        where: { session_id: sessionId, user_id: userId },
        data: { status: "CANCELLED" }
    });

    return { cancelled: true, sessionId };
};
