import prisma from "../config/db.js"
import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";
import { getCurrentGstRateWhole } from "./gstService.js";
import { getOrCreateTestWallet } from "./testWalletService.js";

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

    if (goldBuyRate === 0 || silverBuyRate === 0) {
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

export const executeCoinPurchaseSessionService = async (sessionId: string, userId: string) => {
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

    return await prisma.$transaction(async (tx) => {
        const testWallet = await getOrCreateTestWallet(tx, userId);

        if (Number(testWallet.virtualBalance) < totalToDeduct) {
            throw new Error(`Insufficient balance. Required: ₹${totalToDeduct.toFixed(2)}`);
        }

        await tx.testWallet.update({
            where: { userId },
            data: {
                virtualBalance: { decrement: totalToDeduct }
            }
        });

        const transactions: any[] = [];
        for (const item of lockedCart.items) {
            await tx.coinInventory.upsert({
                where: {
                    userId_coinGrams_metal: { userId, coinGrams: item.weight, metal: item.metal }
                },
                create: {
                    userId,
                    metal: item.metal,
                    coinGrams: item.weight,
                    quantity: item.quantity
                },
                update: {
                    quantity: { increment: item.quantity }
                }
            });

            const basePrice = Number(item.item_price);
            const gst = basePrice * gstMultiplier;
            
            const transaction = await tx.coinTransaction.create({
                data: {
                    user_id: userId,
                    session_id: session.session_id,
                    locked_cart_id: lockedCart.id,
                    metal: item.metal,
                    type: "BUY",
                    weight: item.weight,
                    quantity: item.quantity,
                    rate_per_gram: item.metal === "GOLD" ? lockedCart.gold_locked_price : lockedCart.silver_locked_price,
                    gold_locked_price: item.metal === "GOLD" ? basePrice : 0,
                    silver_locked_price: item.metal === "SILVER" ? basePrice : 0,
                    gst: gst,
                    gstRate: session.gstRate,
                    final_amount: basePrice + gst,
                    payment_mode: "WALLET",
                    status: "COMPLETED"
                }
            });
            transactions.push(transaction);
        }

        await tx.coinPurchaseSession.update({
            where: { session_id: sessionId },
            data: { status: "COMPLETED" }
        });

        await tx.cartItem.deleteMany({
            where: {
                cart: { user_id: userId }
            }
        });

        return { success: true, transactions };
    });
};