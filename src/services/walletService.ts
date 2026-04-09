import prisma from "../config/db.js";
import {
  WalletBalance,
  WalletStats,
} from "../types/index.js";
import { getUserCoinInventory } from "./coinService.js";
import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";

export const getUserWalletBalance = async (
  userId: string,
): Promise<WalletBalance> => {
  let wallet = await prisma.inventory.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.inventory.create({
      data: { userId },
    });
  }

  const [goldRate, silverRate, coinInventory] = await Promise.all([
    getCurrentGoldRate(),
    getCurrentSilverRate(),
    getUserCoinInventory(userId),
  ]);

  const goldGrams = Number(wallet.goldBalance);
  const silverGrams = Number(wallet.silverBalance);
  const goldBuyRate = goldRate.buyRate;
  const silverBuyRate = silverRate.buyRate;

  const goldValuation = goldGrams * goldBuyRate;
  const silverValuation = silverGrams * silverBuyRate;

  let goldCoinGrams = 0;
  let silverCoinGrams = 0;
  coinInventory.forEach((coin) => {
    const coinTotalGrams = coin.coinGrams * coin.quantity;
    if (coin.metal === "GOLD") goldCoinGrams += coinTotalGrams;
    else if (coin.metal === "SILVER") silverCoinGrams += coinTotalGrams;
  });

  const goldCoinValuation = goldCoinGrams * goldBuyRate;
  const silverCoinValuation = silverCoinGrams * silverBuyRate;

  const totalValuation = goldValuation + silverValuation + goldCoinValuation + silverCoinValuation;

  return {
    goldGrams,
    silverGrams,
    rupeeBalance: Number(wallet.rupeeBalance),

    goldCoinGrams,
    silverCoinGrams,

    goldValuation,
    silverValuation,
    goldCoinValuation,
    silverCoinValuation,
    totalValuation,

    currentGoldRate: goldBuyRate,
    currentSilverRate: silverBuyRate,
  };
};

export const getWalletStats = async (userId: string): Promise<WalletStats> => {
  const transactions = await prisma.metalTransaction.findMany({
    where: {
      user_id: userId,
      transactionType: "BUY",
    },
    orderBy: { createdAt: "desc" },
  });

  if (transactions.length === 0) {
    return {
      totalBought: 0,
      totalSold: 0,
      avgBuyPrice: 0,
      profitLoss: 0,
      profitLossPercent: 0,
    };
  }

  const wallet = await prisma.inventory.findUnique({ where: { userId } });

  const goldTransactions = transactions.filter(tx => tx.metalType === "GOLD");
  const silverTransactions = transactions.filter(tx => tx.metalType === "SILVER");

  const calculateStats = async (txs: any[], getRate: () => Promise<any>, getBalance: (w: any) => number) => {
    if (txs.length === 0) return { totalBought: 0, avgBuyPrice: 0, currentValue: 0, investedValue: 0 };

    const totalBought = txs.reduce((sum, tx) => sum + parseFloat(String(tx.metalGrams)), 0);
    const totalSpent = txs.reduce((sum, tx) => sum + parseFloat(String(tx.totalAmount)), 0);
    const avgBuyPrice = totalSpent / totalBought;

    const currentRate = await getRate();
    const currentPrice = parseFloat(String(currentRate.buyRate));
    const currentBalance = wallet ? getBalance(wallet) : 0;

    return {
      totalBought,
      avgBuyPrice,
      currentValue: currentBalance * currentPrice,
      investedValue: currentBalance * avgBuyPrice
    };
  };

  const goldStats = await calculateStats(goldTransactions, getCurrentGoldRate, (w) => parseFloat(String(w.goldBalance)));
  const silverStats = await calculateStats(silverTransactions, getCurrentSilverRate, (w) => parseFloat(String(w.silverBalance)));

  const totalBought = goldStats.totalBought + silverStats.totalBought;
  const currentValue = goldStats.currentValue + silverStats.currentValue;
  const investedValue = goldStats.investedValue + silverStats.investedValue;
  const profitLoss = currentValue - investedValue;
  const profitLossPercent = investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

  return {
    totalBought,
    totalSold: 0,
    avgBuyPrice: totalBought > 0 ? (goldStats.avgBuyPrice + silverStats.avgBuyPrice) / 2 : 0,
    profitLoss,
    profitLossPercent,
  };
};
