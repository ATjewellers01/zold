const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const { getCurrentGoldRate } = require("./goldService");

// Valid coin denominations in grams
const VALID_COIN_GRAMS = [1, 2, 5, 10];

/**
 * Get available coin types with current prices
 */
const getCoinTypes = async () => {
  const goldRate = await getCurrentGoldRate();
  const buyRate = parseFloat(goldRate.buyRate);

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
const getUserCoinInventory = async (userId) => {
  const inventory = await prisma.coinInventory.findMany({
    where: { userId },
    orderBy: { coinGrams: "asc" },
  });

  // Get current gold rate for valuation
  const goldRate = await getCurrentGoldRate();
  const currentRate = parseFloat(goldRate.buyRate);

  // Calculate total value
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

  // Also include coins with 0 quantity for display
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
const buyCoinWithRupees = async (userId, coinGrams, quantity = 1) => {
  // Validate coin type
  if (!VALID_COIN_GRAMS.includes(coinGrams)) {
    throw new Error(
      `Invalid coin type. Valid options: ${VALID_COIN_GRAMS.join(", ")} grams`,
    );
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  // Get current gold rate
  const goldRate = await getCurrentGoldRate();
  const ratePerGram = parseFloat(goldRate.buyRate);

  // Calculate amounts
  const goldValue = coinGrams * quantity * ratePerGram;
  const gst = goldValue * 0.03; // 3% GST
  const finalAmount = goldValue + gst;

  // Check test wallet balance
  let testWallet = await prisma.testWallet.findUnique({
    where: { userId },
  });

  if (!testWallet) {
    testWallet = await prisma.testWallet.create({
      data: { userId, virtualBalance: 10000 },
    });
  }

  if (parseFloat(testWallet.virtualBalance) < finalAmount) {
    throw new Error(
      `Insufficient test wallet balance. Required: ₹${finalAmount.toFixed(2)}, Available: ₹${parseFloat(testWallet.virtualBalance).toFixed(2)}`,
    );
  }

  // Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct from test wallet
    const updatedTestWallet = await tx.testWallet.update({
      where: { userId },
      data: {
        virtualBalance: { decrement: finalAmount },
      },
    });

    // Update or create coin inventory
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

    // Create transaction record
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
const convertWalletGoldToCoin = async (userId, coinGrams, quantity = 1) => {
  // Validate coin type
  if (!VALID_COIN_GRAMS.includes(coinGrams)) {
    throw new Error(
      `Invalid coin type. Valid options: ${VALID_COIN_GRAMS.join(", ")} grams`,
    );
  }

  if (quantity < 1) {
    throw new Error("Quantity must be at least 1");
  }

  const requiredGold = coinGrams * quantity;

  // Check user's gold wallet balance
  const wallet = await prisma.wallet.findUnique({
    where: { userId },
  });

  if (!wallet || parseFloat(wallet.goldBalance) < requiredGold) {
    const available = wallet ? parseFloat(wallet.goldBalance) : 0;
    throw new Error(
      `Insufficient gold balance. Required: ${requiredGold}g, Available: ${available.toFixed(4)}g`,
    );
  }

  // Get current gold rate for record keeping
  const goldRate = await getCurrentGoldRate();
  const ratePerGram = parseFloat(goldRate.buyRate);
  const goldValue = requiredGold * ratePerGram;

  // Execute transaction
  const result = await prisma.$transaction(async (tx) => {
    // Deduct gold from wallet
    const updatedWallet = await tx.wallet.update({
      where: { userId },
      data: {
        goldBalance: { decrement: requiredGold },
      },
    });

    // Update or create coin inventory
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

    // Create transaction record (no GST for conversion, making charges FREE)
    const transaction = await tx.coinTransaction.create({
      data: {
        userId,
        type: "CONVERT_FROM_GOLD",
        coinGrams,
        quantity,
        ratePerGram,
        goldValue,
        gst: 0, // No GST for wallet gold conversion
        finalAmount: goldValue, // Just for record, no payment made
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
const getCoinTransactionHistory = async (userId, limit = 20) => {
  const transactions = await prisma.coinTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return transactions.map((tx) => ({
    ...tx,
    coinName: `${tx.coinGrams} Gram Coin`,
    ratePerGram: parseFloat(tx.ratePerGram).toFixed(2),
    goldValue: parseFloat(tx.goldValue).toFixed(2),
    gst: parseFloat(tx.gst).toFixed(2),
    finalAmount: parseFloat(tx.finalAmount).toFixed(2),
  }));
};

module.exports = {
  getCoinTypes,
  getUserCoinInventory,
  buyCoinWithRupees,
  convertWalletGoldToCoin,
  getCoinTransactionHistory,
  VALID_COIN_GRAMS,
};
