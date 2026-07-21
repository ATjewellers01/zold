import prisma from "../config/db.js";
import { getCurrentGoldRate } from "./metal_rate.service.js";
import { getCurrentGstRate, getCurrentGstRateWhole } from "./gst.service.js";

export const VALID_COIN_GRAMS = [1, 2, 2.5, 5, 8, 10];

interface CoinType {
  grams: number;
  name: string;
  description: string;
  basePrice: string;
  gst: string;
  totalPrice: string;
  ratePerGram: string;
}

interface CoinInventoryResult {
  inventory: any[];
  totalGrams: number;
  totalValue: string;
  currentRatePerGram: string;
}

export const getCoinTypes = async (): Promise<CoinType[]> => {
  const goldRate = await getCurrentGoldRate();
  const buyRate = parseFloat(String(goldRate.buyRate));
  const gstMultiplier = await getCurrentGstRate();

  return VALID_COIN_GRAMS.map((grams) => {
    const basePrice = grams * buyRate;
    const gst = basePrice * gstMultiplier;
    return {
      grams,
      name: `${grams} Gram Gold Coin`,
      description: `24K Pure Gold Coin - ${grams}g`,
      basePrice: basePrice.toFixed(2),
      gst: gst.toFixed(2),
      totalPrice: (basePrice + gst).toFixed(2),
      ratePerGram: buyRate.toFixed(2),
    };
  });
};

export const getUserCoinInventory = async (userId: string) => {
  const inventory = await prisma.coinInventory.findMany({
    where: { userId }
  });

  return inventory;
};

export const buyCoinWithRupees = async (
  userId: string,
  coinGrams: number,
  quantity: number = 1,
) => {
  if (!VALID_COIN_GRAMS.includes(coinGrams)) {
    throw new Error(
      `Invalid coin type. Valid options: ${VALID_COIN_GRAMS.join(", ")} grams`,
    );
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const goldRate = await getCurrentGoldRate();
  const ratePerGram = parseFloat(String(goldRate.buyRate));

  const goldValue = coinGrams * quantity * ratePerGram;
  const gstMultiplier = await getCurrentGstRate();
  const gstRateWhole = await getCurrentGstRateWhole();
  const gst = goldValue * gstMultiplier;
  const finalAmount = goldValue + gst;

  const result = await prisma.$transaction(async (tx) => {
    const existingInventory = await tx.coinInventory.findUnique({
      where: {
        userId_coinGrams_metal: { userId, coinGrams, metal: "GOLD" },
      },
    });

    let updatedInventory;
    if (existingInventory) {
      updatedInventory = await tx.coinInventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: { increment: quantity },
        },
      });
    } else {
      updatedInventory = await tx.coinInventory.create({
        data: {
          userId,
          coinGrams,
          quantity,
          metal: "GOLD",
        },
      });
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        user_id: userId,
        metal: "GOLD",
        type: "BUY",
        weight: coinGrams,
        quantity,
        rate_per_gram: ratePerGram,
        gold_locked_price: goldValue,
        silver_locked_price: 0,
        gst,
        gstRate: gstRateWhole,
        final_amount: finalAmount,
        payment_mode: "WALLET",
        status: "COMPLETED",
      },
    });

    return {
      transaction,
      updatedInventory,
    };
  });

  return result;
};

export const convertWalletGoldToCoin = async (
  userId: string,
  coinGrams: number,
  quantity: number = 1,
) => {
  if (!VALID_COIN_GRAMS.includes(coinGrams)) {
    throw new Error(
      `Invalid coin type. Valid options: ${VALID_COIN_GRAMS.join(", ")} grams`,
    );
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const requiredGold = coinGrams * quantity;

  const wallet = await prisma.inventory.findUnique({
    where: { userId },
  });

  if (!wallet || parseFloat(String(wallet.goldBalance)) < requiredGold) {
    const available = wallet ? parseFloat(String(wallet.goldBalance)) : 0;
    throw new Error(
      `Insufficient gold balance. Required: ${requiredGold}g, Available: ${available.toFixed(4)}g`,
    );
  }

  const goldRate = await getCurrentGoldRate();
  const ratePerGram = parseFloat(String(goldRate.buyRate));
  const goldValue = requiredGold * ratePerGram;

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.inventory.update({
      where: { userId },
      data: {
        goldBalance: { decrement: requiredGold },
      },
    });

    const existingInventory = await tx.coinInventory.findUnique({
      where: {
        userId_coinGrams_metal: { userId, coinGrams, metal: "GOLD" },
      },
    });

    let updatedInventory;
    if (existingInventory) {
      updatedInventory = await tx.coinInventory.update({
        where: { id: existingInventory.id },
        data: {
          quantity: { increment: quantity },
        },
      });
    } else {
      updatedInventory = await tx.coinInventory.create({
        data: {
          userId,
          coinGrams,
          quantity,
          metal: "GOLD",
        },
      });
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        user_id: userId,
        metal: "GOLD",
        type: "BUY",
        weight: coinGrams,
        quantity,
        rate_per_gram: ratePerGram,
        gold_locked_price: goldValue,
        silver_locked_price: 0,
        gst: 0,
        gstRate: 0,
        final_amount: goldValue,
        payment_mode: "WALLET",
        status: "COMPLETED",
      },
    });

    return {
      transaction,
      updatedInventory,
      updatedWallet,
      goldDeducted: requiredGold,
    };
  });

  return result;
};

export const getCoinTransactionHistory = async (
  userId: string,
  limit: number = 20,
) => {
  const transactions = await prisma.coinTransaction.findMany({
    where: { user_id: userId },
    orderBy: { created_at: "desc" },
    take: limit,
  });

  return transactions.map((tx) => ({
    ...tx,
    coinName: `${tx.weight} Gram Coin`,
    ratePerGram: parseFloat(String(tx.rate_per_gram)).toFixed(2),
    goldValue: parseFloat(String(tx.gold_locked_price)).toFixed(2),
    gst: parseFloat(String(tx.gst)).toFixed(2),
    finalAmount: parseFloat(String(tx.final_amount)).toFixed(2),
  }));
};
