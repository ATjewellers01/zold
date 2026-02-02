const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { getLiveGoldPrice } = require("./goldApiService");

/**
 * Get or create test wallet for user
 */
const getTestWallet = async (userId) => {
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
const addTestCredits = async (userId, amount = 10000) => {
  const testWallet = await getTestWallet(userId);

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
const resetTestWallet = async (userId) => {
  const testWallet = await getTestWallet(userId);

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
 * Fetches live price from GoldAPI if available, otherwise uses database rates
 */
const getCurrentGoldRate = async (useLivePrice = true) => {
  // Try to fetch live price from GoldAPI
  if (useLivePrice) {
    try {
      const livePrice = await getLiveGoldPrice();

      // Only use API price if it's valid (not 0 and source is goldapi)
      if (livePrice.source === "goldapi" && livePrice.buyRate > 0) {
        console.log("Using live gold price:", livePrice.buyRate);

        // Update database with latest rate
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
    } catch (error) {
      console.error("Error fetching live gold price:", error.message);
    }
  }

  // Fallback to database rate
  let goldRate = await prisma.goldRate.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // If no rate exists in database, throw error - don't create dummy data
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
const updateGoldRate = async (buyRate, sellRate, userId) => {
  // Mark all existing rates as inactive
  await prisma.goldRate.updateMany({
    where: { isActive: true },
    data: { isActive: false },
  });

  // Create new active rate
  const newRate = await prisma.goldRate.create({
    data: {
      buyRate: parseFloat(buyRate),
      sellRate: parseFloat(sellRate),
      isActive: true,
      createdBy: userId,
    },
  });

  return newRate;
};

/**
 * Get gold rate history
 */
const getGoldRateHistory = async (limit = 10) => {
  const history = await prisma.goldRate.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return history;
};

/**
 * Buy gold using test wallet
 */
const buyGold = async (userId, data) => {
  const {
    amountInRupees,
    goldGrams,
    storageType,
    paymentMode = "TEST_WALLET",
  } = data;

  // Get current gold rate
  const goldRate = await getCurrentGoldRate();

  // Calculate amounts
  const totalAmount = parseFloat(amountInRupees);
  const gst = totalAmount * 0.03; // 3% GST
  const finalAmount = totalAmount + gst;

  // Check test wallet balance
  const testWallet = await getTestWallet(userId);
  if (parseFloat(testWallet.virtualBalance) < finalAmount) {
    throw new Error("Insufficient test wallet balance");
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct from test wallet
    const updatedTestWallet = await tx.testWallet.update({
      where: { userId },
      data: {
        virtualBalance: {
          decrement: finalAmount,
        },
      },
    });

    // Get or create user wallet
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

    // Add gold to wallet
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: {
          increment: parseFloat(goldGrams),
        },
      },
    });

    // Create transaction record
    const transaction = await tx.goldTransaction.create({
      data: {
        userId,
        type: "BUY",
        goldGrams: parseFloat(goldGrams),
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
 * Gold is deducted immediately, but money is NOT credited until approved
 */
const createSellGoldRequest = async (userId, data) => {
  const { goldGrams, paymentMethod, bankAccountId, paymentMethodId } = data;

  // Get current gold rate
  const goldRate = await getCurrentGoldRate();

  // Calculate amounts using sell rate
  const grossAmount = parseFloat(goldGrams) * parseFloat(goldRate.sellRate);
  const gst = grossAmount * 0.03; // 3% GST deducted
  const netAmount = grossAmount - gst;

  // Check user's gold balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet || parseFloat(wallet.goldBalance) < parseFloat(goldGrams)) {
    throw new Error("Insufficient gold balance");
  }

  // Start transaction - deduct gold but DON'T credit money
  const result = await prisma.$transaction(async (tx) => {
    // Deduct gold from wallet
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: {
          decrement: parseFloat(goldGrams),
        },
      },
    });

    // Create sell request with PENDING status
    const sellRequest = await tx.sellGoldRequest.create({
      data: {
        userId,
        goldGrams: parseFloat(goldGrams),
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

    // Create transaction record with PENDING status
    const transaction = await tx.goldTransaction.create({
      data: {
        userId,
        type: "SELL",
        goldGrams: parseFloat(goldGrams),
        ratePerGram: goldRate.sellRate,
        totalAmount: grossAmount,
        gst,
        finalAmount: netAmount,
        paymentMode:
          paymentMethod === "credit" ? "WALLET_CREDIT" : "BANK_TRANSFER",
        status: "PENDING", // Changed from COMPLETED to PENDING
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
const getUserSellRequests = async (userId) => {
  const requests = await prisma.sellGoldRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return requests;
};

/**
 * Get all pending sell requests (Admin only)
 */
const getPendingSellRequests = async () => {
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
const getAllSellRequests = async (status = null, limit = 50) => {
  const where = status ? { status } : {};

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
 * Credits money to user's wallet
 */
const approveSellGoldRequest = async (
  requestId,
  adminId,
  adminNotes = null,
) => {
  // Get the request
  const sellRequest = await prisma.sellGoldRequest.findUnique({
    where: { id: requestId },
  });

  if (!sellRequest) {
    throw new Error("Sell request not found");
  }

  if (sellRequest.status !== "PENDING") {
    throw new Error("Request has already been processed");
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update sell request status
    const updatedRequest = await tx.sellGoldRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes,
      },
    });

    // Credit money to user's test wallet
    const testWallet = await tx.testWallet.findUnique({
      where: { userId: sellRequest.userId },
    });

    let updatedTestWallet;
    if (testWallet) {
      updatedTestWallet = await tx.testWallet.update({
        where: { userId: sellRequest.userId },
        data: {
          virtualBalance: {
            increment: parseFloat(sellRequest.netAmount),
          },
        },
      });
    } else {
      updatedTestWallet = await tx.testWallet.create({
        data: {
          userId: sellRequest.userId,
          virtualBalance: parseFloat(sellRequest.netAmount),
        },
      });
    }

    // Update the transaction status to COMPLETED
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
 * Returns gold to user's wallet
 */
const rejectSellGoldRequest = async (requestId, adminId, adminNotes = null) => {
  // Get the request
  const sellRequest = await prisma.sellGoldRequest.findUnique({
    where: { id: requestId },
  });

  if (!sellRequest) {
    throw new Error("Sell request not found");
  }

  if (sellRequest.status !== "PENDING") {
    throw new Error("Request has already been processed");
  }

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update sell request status
    const updatedRequest = await tx.sellGoldRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedBy: adminId,
        processedAt: new Date(),
        adminNotes,
      },
    });

    // Return gold to user's wallet
    const updatedWallet = await tx.wallet.update({
      where: { userId: sellRequest.userId },
      data: {
        goldBalance: {
          increment: sellRequest.goldGrams,
        },
      },
    });

    // Update the transaction status to REJECTED
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
 * Legacy sellGold function - now redirects to createSellGoldRequest
 * Kept for backward compatibility
 */
const sellGold = async (userId, data) => {
  return createSellGoldRequest(userId, data);
};

/**
 * Get user's transaction history
 */
const getTransactionHistory = async (userId, limit = 20) => {
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
const getAllTransactionHistory = async (limit = 50) => {
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
const getUserWalletBalance = async (userId) => {
  // Get or create wallet
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

  // Get recent transactions (last 5)
  const recentTransactions = await prisma.goldTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  // Get current gold rate
  const currentRate = await getCurrentGoldRate();

  // Calculate current value
  const currentValue =
    parseFloat(wallet.goldBalance) * parseFloat(currentRate.buyRate);

  return {
    goldBalance: wallet.goldBalance,
    rupeeBalance: wallet.rupeeBalance,
    currentValue,
    currentRate: currentRate.buyRate,
    recentTransactions,
  };
};

/**
 * Get wallet statistics and calculations
 */
const getWalletStats = async (userId) => {
  // Get all user transactions
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

  // Calculate total gold bought
  const totalBought = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.goldGrams),
    0,
  );

  // Calculate average buy price (weighted by amount)
  const totalSpent = transactions.reduce(
    (sum, tx) => sum + parseFloat(tx.totalAmount),
    0,
  );
  const avgBuyPrice = totalSpent / totalBought;

  // Get current rate
  const currentRate = await getCurrentGoldRate();
  const currentPrice = parseFloat(currentRate.buyRate);

  // Get current wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  const currentGoldBalance = wallet ? parseFloat(wallet.goldBalance) : 0;

  // Calculate profit/loss
  const currentValue = currentGoldBalance * currentPrice;
  const investedValue = currentGoldBalance * avgBuyPrice;
  const profitLoss = currentValue - investedValue;
  const profitLossPercent =
    investedValue > 0 ? (profitLoss / investedValue) * 100 : 0;

  return {
    totalBought,
    totalSold: 0, // TODO: Implement when sell is added
    avgBuyPrice,
    profitLoss,
    profitLossPercent,
  };
};

module.exports = {
  getTestWallet,
  addTestCredits,
  resetTestWallet,
  getCurrentGoldRate,
  updateGoldRate,
  getGoldRateHistory,
  buyGold,
  sellGold,
  createSellGoldRequest,
  getUserSellRequests,
  getPendingSellRequests,
  getAllSellRequests,
  approveSellGoldRequest,
  rejectSellGoldRequest,
  getTransactionHistory,
  getAllTransactionHistory,
  getUserWalletBalance,
  getWalletStats,
};
