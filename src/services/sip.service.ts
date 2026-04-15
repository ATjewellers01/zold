import prisma from "../config/db.js"
import { razorpay } from "../config/razorpay.js";

import { getCurrentGoldRate, getCurrentSilverRate } from "./metal_rate.service.js";

export const createSipService = async (
    name: string,
    type: "REGULAR",
    metal: "GOLD" | "SILVER",
) => {
    const sip = await prisma.sip.create({
        data: {
            name,
            type: type,
            metal,
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
    invested_amount: Number,
    day_of_month: Number,
) => {

    const goldPrice = await getCurrentGoldRate();
    const silverPrice = await getCurrentSilverRate();

    if (metal === "GOLD" && goldPrice.buyRate <= 0) {
        throw new Error("Gold rate unavailable");
    }
    if (metal === "SILVER" && silverPrice.buyRate <= 0) {
        throw new Error("Silver rate unavailable");
    }

    const totalGramsPurchased = metal === "GOLD" ?
        amount / goldPrice.buyRate : amount / silverPrice.buyRate;

    const order = await razorpay.orders.create({
        amount: Math.round(Number(amount) * 100),
        currency: "INR",
        receipt: `reciept_sip${Date.now()}`
    });

    return {
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        keId: process.env.RAZORPAY_KEY_ID,
        sipDetails: {
            name,
            metal,
            amount,
            day_of_month
        }
    };
}