import prisma from "../config/db";
import { getCurrentGoldRate } from "./goldService";
import { CoinInventory, CoinTransaction } from "../../generated/prisma";

// Valid coin denominations in grams
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

/**
 * Get available coin types with current prices
 */
export const getCoinTypes = async (): Promise<CoinType[]> => {
  const goldRate = await getCurrentGoldRate();
  const buyRate = parseFloat(String(goldRate.buyRate));

  return VALID_COIN_GRAMS.map((grams) => {
    const basePrice = grams * buyRate;
    const gst = basePrice * 0.03;
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

/**
 * Get user's coin inventory
 */
export const getUserCoinInventory = async (
  userId: string,
): Promise<CoinInventoryResult> => {
  const inventory = await prisma.coinInventory.findMany({
    where: { userId },
    orderBy: { coinGrams: "asc" },
  });

  const goldRate = await getCurrentGoldRate();
  const currentRate = parseFloat(String(goldRate.buyRate));

  let totalGrams = 0;
  let totalValue = 0;

  const enrichedInventory = inventory.map((item) => {
    const itemGrams = item.coinGrams * item.quantity;
    const itemValue = itemGrams * currentRate;
    totalGrams += itemGrams;
    totalValue += itemValue;

    return {
      ...item,
      totalGrams: itemGrams,
      currentValue: itemValue.toFixed(2),
      coinName: `${item.coinGrams} Gram Coin`,
    };
  });

  const allCoinsInventory = VALID_COIN_GRAMS.map((grams) => {
    const existing = enrichedInventory.find((item) => item.coinGrams === grams);
    if (existing) return existing;

    return {
      id: null,
      userId,
      coinGrams: grams,
      quantity: 0,
      totalGrams: 0,
      currentValue: "0.00",
      coinName: `${grams} Gram Coin`,
    };
  });

  return {
    inventory: allCoinsInventory,
    totalGrams,
    totalValue: totalValue.toFixed(2),
    currentRatePerGram: currentRate.toFixed(2),
  };
};

/**
 * Buy coin with rupees (using test wallet)
 */
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
  const gst = goldValue * 0.03;
  const finalAmount = goldValue + gst;

  let testWallet = await prisma.testWallet.findUnique({
    where: { userId },
  });

  if (!testWallet) {
    testWallet = await prisma.testWallet.create({
      data: { userId, virtualBalance: 10000 },
    });
  }

  if (parseFloat(String(testWallet.virtualBalance)) < finalAmount) {
    throw new Error(
      `Insufficient test wallet balance. Required: ₹${finalAmount.toFixed(2)}, Available: ₹${parseFloat(String(testWallet.virtualBalance)).toFixed(2)}`,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedTestWallet = await tx.testWallet.update({
      where: { userId },
      data: {
        virtualBalance: { decrement: finalAmount },
      },
    });

    const existingInventory = await tx.coinInventory.findUnique({
      where: {
        userId_coinGrams: { userId, coinGrams },
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
        },
      });
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        userId,
        type: "BUY_WITH_RUPEES",
        coinGrams,
        quantity,
        ratePerGram,
        goldValue,
        gst,
        finalAmount,
        paymentMode: "TEST_WALLET",
        status: "COMPLETED",
      },
    });

    return {
      transaction,
      updatedInventory,
      updatedTestWallet,
    };
  });

  return result;
};

/**
 * Convert wallet gold to coin
 */
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

  const wallet = await prisma.wallet.findUnique({
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
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: { decrement: requiredGold },
      },
    });

    const existingInventory = await tx.coinInventory.findUnique({
      where: {
        userId_coinGrams: { userId, coinGrams },
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
        },
      });
    }

    const transaction = await tx.coinTransaction.create({
      data: {
        userId,
        type: "CONVERT_FROM_GOLD",
        coinGrams,
        quantity,
        ratePerGram,
        goldValue,
        gst: 0,
        finalAmount: goldValue,
        paymentMode: "WALLET_GOLD",
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

/**
 * Get coin transaction history
 */
export const getCoinTransactionHistory = async (
  userId: string,
  limit: number = 20,
) => {
  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map((tx) => ({
    ...tx,
    coinName: `${tx.coinGrams} Gram Coin`,
    ratePerGram: parseFloat(String(tx.ratePerGram)).toFixed(2),
    goldValue: parseFloat(String(tx.goldValue)).toFixed(2),
    gst: parseFloat(String(tx.gst)).toFixed(2),
    finalAmount: parseFloat(String(tx.finalAmount)).toFixed(2),
  }));
};
