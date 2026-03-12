import prisma from "../config/db.js";
import { getLiveGoldPrice } from "./goldApiService.js";
import {
  BuyGoldData,
  SellGoldData,
  WalletBalance,
  WalletStats,
  GoldRateData,
} from "../types/index.js";
import {
  GoldRate,
  Wallet,
  TestWallet,
  GoldTransaction,
  SellGoldRequest,
} from "../../generated/prisma/index.js";

/**
 * Get or create test wallet for user
 */
export const getTestWallet = async (userId: string): Promise<TestWallet> => {
  let testWallet = await prisma.testWallet.findUnique({
    where: { userId },
  });

  if (!testWallet) {
    testWallet = await prisma.testWallet.create({
      data: {
        userId,
        virtualBalance: 10000,
      },
    });
  }

  return testWallet;
};

/**
 * Add virtual credits to test wallet
 */
export const addTestCredits = async (
  userId: string,
  amount: number = 10000,
): Promise<TestWallet> => {
  await getTestWallet(userId);

  const updatedWallet = await prisma.testWallet.update({
    where: { userId },
    data: {
      virtualBalance: {
        increment: amount,
      },
    },
  });

  return updatedWallet;
};

/**
 * Reset test wallet to default balance
 */
export const resetTestWallet = async (userId: string): Promise<TestWallet> => {
  await getTestWallet(userId);

  const updatedWallet = await prisma.testWallet.update({
    where: { userId },
    data: {
      virtualBalance: 10000,
    },
  });

  return updatedWallet;
};

/**
 * Get current active gold rate
 */
export const getCurrentGoldRate = async (
  useLivePrice: boolean = true,
): Promise<GoldRate> => {
  if (useLivePrice) {
    try {
      const livePrice = await getLiveGoldPrice();

      if (livePrice.source === "goldapi" && livePrice.buyRate > 0) {
        console.log("Using live gold price:", livePrice.buyRate);

        await prisma.goldRate.updateMany({
          where: { isActive: true },
          data: { isActive: false },
        });

        const newRate = await prisma.goldRate.create({
          data: {
            buyRate: livePrice.buyRate,
            sellRate: livePrice.sellRate,
            isActive: true,
          },
        });

        return newRate;
      } else {
        console.log(
          "API not available or returned 0:",
          livePrice.source,
          livePrice.error || "",
        );
      }
    } catch (error: any) {
      console.error("Error fetching live gold price:", error.message);
    }
  }

  const goldRate = await prisma.goldRate.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  if (!goldRate) {
    throw new Error(
      "No gold rate available. Please configure GOLD_API_KEY or add a rate manually.",
    );
  }

  console.log("Using database gold rate:", goldRate.buyRate);
  return goldRate;
};

/**
 * Update gold rate (Admin only)
 */
export const updateGoldRate = async (
  buyRate: number,
  sellRate: number,
  userId: string,
): Promise<GoldRate> => {
  await prisma.goldRate.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  const newRate = await prisma.goldRate.create({
    data: {
      buyRate: parseFloat(String(buyRate)),
      sellRate: parseFloat(String(sellRate)),
      isActive: true,
      createdBy: userId,
    },
  });

  return newRate;
};

/**
 * Get gold rate history
 */
export const getGoldRateHistory = async (
  limit: number = 10,
): Promise<GoldRate[]> => {
  const history = await prisma.goldRate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return history;
};

/**
 * Buy gold using test wallet
 */
export const buyGold = async (userId: string, data: BuyGoldData) => {
  const {
    amountInRupees,
    goldGrams,
    storageType,
    paymentMode = "TEST_WALLET",
  } = data;

  const goldRate = await getCurrentGoldRate();

  const totalAmount = parseFloat(String(amountInRupees));
  const gst = totalAmount * 0.03;
  const finalAmount = totalAmount + gst;

  const testWallet = await getTestWallet(userId);
  if (parseFloat(String(testWallet.virtualBalance)) < finalAmount) {
    throw new Error("Insufficient test wallet balance");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedTestWallet = await tx.testWallet.update({
      where: { userId },
      data: {
        virtualBalance: {
          decrement: finalAmount,
        },
      },
    });

    let wallet = await tx.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId,
          goldBalance: 0,
          rupeeBalance: 0,
        },
      });
    }

    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: {
          increment: parseFloat(String(goldGrams)),
        },
      },
    });

    const transaction = await tx.goldTransaction.create({
      data: {
        userId,
        type: "BUY",
        goldGrams: parseFloat(String(goldGrams)),
        ratePerGram: goldRate.buyRate,
        totalAmount,
        gst,
        finalAmount,
        paymentMode,
        status: "COMPLETED",
        storageType: storageType || "vault",
      },
    });

    return {
      transaction,
      updatedWallet,
      updatedTestWallet,
    };
  });

  return result;
};

/**
 * Create a sell gold request (pending admin approval)
 */
export const createSellGoldRequest = async (
  userId: string,
  data: SellGoldData,
) => {
  const { goldGrams, paymentMethod, bankAccountId, paymentMethodId } = data;

  const goldRate = await getCurrentGoldRate();

  const grossAmount =
    parseFloat(String(goldGrams)) * parseFloat(String(goldRate.sellRate));
  const gst = grossAmount * 0.03;
  const netAmount = grossAmount - gst;

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (
    !wallet ||
    parseFloat(String(wallet.goldBalance)) < parseFloat(String(goldGrams))
  ) {
    throw new Error("Insufficient gold balance");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: {
          decrement: parseFloat(String(goldGrams)),
        },
      },
    });

    const sellRequest = await tx.sellGoldRequest.create({
      data: {
        userId,
        goldGrams: parseFloat(String(goldGrams)),
        ratePerGram: goldRate.sellRate,
        grossAmount,
        gst,
        netAmount,
        paymentMethod: paymentMethod || "credit",
        bankAccountId: bankAccountId || null,
        paymentMethodId: paymentMethodId || null,
        status: "PENDING",
      },
    });

    const transaction = await tx.goldTransaction.create({
      data: {
        userId,
        type: "SELL",
        goldGrams: parseFloat(String(goldGrams)),
        ratePerGram: goldRate.sellRate,
        totalAmount: grossAmount,
        gst,
        finalAmount: netAmount,
        paymentMode:
          paymentMethod === "credit" ? "WALLET_CREDIT" : "BANK_TRANSFER",
        status: "PENDING",
        storageType: "vault",
      },
    });

    return {
      sellRequest,
      transaction,
      updatedWallet,
    };
  });

  return result;
};

/**
 * Get user's sell gold requests
 */
export const getUserSellRequests = async (
  userId: string,
): Promise<SellGoldRequest[]> => {
  const requests = await prisma.sellGoldRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return requests;
};

/**
 * Get all pending sell requests (Admin only)
 */
export const getPendingSellRequests = async () => {
  const requests = await prisma.sellGoldRequest.findMany({
    where: { status: "PENDING" },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return requests;
};

/**
 * Get all sell requests (Admin only)
 */
export const getAllSellRequests = async (
  status: string | null = null,
  limit: number = 50,
) => {
  const where = status ? { status: status as any } : {};

  const requests = await prisma.sellGoldRequest.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return requests;
};

/**
 * Approve sell gold request (Admin only)
 */
export const approveSellGoldRequest = async (
  requestId: string,
  adminId: string,
  adminNotes: string | null = null,
) => {
  const sellRequest = await prisma.sellGoldRequest.findUnique({
    where: { id: requestId },
  });

  if (!sellRequest) {
    throw new Error("Sell request not found");
  }

  if (sellRequest.status !== "PENDING") {
    throw new Error("Request has already been processed");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.sellGoldRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes,
      },
    });

    const testWallet = await tx.testWallet.findUnique({
      where: { userId: sellRequest.userId },
    });

    let updatedTestWallet;
    if (testWallet) {
      updatedTestWallet = await tx.testWallet.update({
        where: { userId: sellRequest.userId },
        data: {
          virtualBalance: {
            increment: parseFloat(String(sellRequest.netAmount)),
          },
        },
      });
    } else {
      updatedTestWallet = await tx.testWallet.create({
        data: {
          userId: sellRequest.userId,
          virtualBalance: parseFloat(String(sellRequest.netAmount)),
        },
      });
    }

    await tx.goldTransaction.updateMany({
      where: {
        userId: sellRequest.userId,
        type: "SELL",
        goldGrams: sellRequest.goldGrams,
        status: "PENDING",
      },
      data: {
        status: "COMPLETED",
      },
    });

    return {
      sellRequest: updatedRequest,
      updatedTestWallet,
    };
  });

  return result;
};

/**
 * Reject sell gold request (Admin only)
 */
export const rejectSellGoldRequest = async (
  requestId: string,
  adminId: string,
  adminNotes: string | null = null,
) => {
  const sellRequest = await prisma.sellGoldRequest.findUnique({
    where: { id: requestId },
  });

  if (!sellRequest) {
    throw new Error("Sell request not found");
  }

  if (sellRequest.status !== "PENDING") {
    throw new Error("Request has already been processed");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.sellGoldRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes,
      },
    });

    const updatedWallet = await tx.wallet.update({
      where: { userId: sellRequest.userId },
      data: {
        goldBalance: {
          increment: sellRequest.goldGrams,
        },
      },
    });

    await tx.goldTransaction.updateMany({
      where: {
        userId: sellRequest.userId,
        type: "SELL",
        goldGrams: sellRequest.goldGrams,
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
      },
    });

    return {
      sellRequest: updatedRequest,
      updatedWallet,
    };
  });

  return result;
};

/**
 * Legacy sellGold function
 */
export const sellGold = async (userId: string, data: SellGoldData) => {
  return createSellGoldRequest(userId, data);
};

/**
 * Get user's transaction history
 */
export const getTransactionHistory = async (
  userId: string,
  limit: number = 20,
): Promise<GoldTransaction[]> => {
  const transactions = await prisma.goldTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions;
};

/**
 * Get all transaction history (Admin only)
 */
export const getAllTransactionHistory = async (limit: number = 50) => {
  const transactions = await prisma.goldTransaction.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions;
};

/**
 * Get user's complete wallet balance
 */
export const getUserWalletBalance = async (
  userId: string,
): Promise<WalletBalance> => {
  let wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: {
        userId,
        goldBalance: 0,
        rupeeBalance: 0,
      },
    });
  }

  const recentTransactions = await prisma.goldTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const currentRate = await getCurrentGoldRate();

  const currentValue =
    parseFloat(String(wallet.goldBalance)) *
    parseFloat(String(currentRate.buyRate));

  return {
    goldBalance: parseFloat(String(wallet.goldBalance)),
    rupeeBalance: parseFloat(String(wallet.rupeeBalance)),
    currentValue,
    currentRate: parseFloat(String(currentRate.buyRate)),
    recentTransactions,
  };
};

/**
 * Get wallet statistics and calculations
 */
export const getWalletStats = async (userId: string): Promise<WalletStats> => {
  const transactions = await prisma.goldTransaction.findMany({
    where: {
      userId,
      type: "BUY",
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

  const totalBought = transactions.reduce(
    (sum, tx) => sum + parseFloat(String(tx.goldGrams)),
    0,
  );

  const totalSpent = transactions.reduce(
    (sum, tx) => sum + parseFloat(String(tx.totalAmount)),
    0,
  );
  const avgBuyPrice = totalSpent / totalBought;

  const currentRate = await getCurrentGoldRate();
  const currentPrice = parseFloat(String(currentRate.buyRate));

  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  const currentGoldBalance = wallet
    ? parseFloat(String(wallet.goldBalance))
    : 0;

  const currentValue = currentGoldBalance * currentPrice;
  const investedValue = currentGoldBalance * avgBuyPrice;
  const profitLoss = currentValue - investedValue;
  const profitLossPercent =
    investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

  return {
    totalBought,
    totalSold: 0,
    avgBuyPrice,
    profitLoss,
    profitLossPercent,
  };
};
