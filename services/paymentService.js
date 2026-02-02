const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

/**
 * Get all payment methods for a user
 * Returns an object with paymentMethods array and bankAccounts array
 * - paymentMethods: Cards, UPI, Wallets, NetBanking (for PaymentMethodsPage)
 * - bankAccounts: Bank accounts for direct transfers (for SellGoldFlow)
 */
const getUserPaymentMethods = async (userId) => {
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  // Return both for maximum compatibility
  return {
    paymentMethods,
    bankAccounts,
  };
};

/**
 * Add a new payment method
 */
const addPaymentMethod = async (userId, methodData) => {
  const {
    type,
    provider,
    upiId,
    cardLast4,
    cardNetwork,
    expiryMonth,
    expiryYear,
    bankAccountId,
  } = methodData;

  // Check if this is the first method - make it primary
  const existingMethods = await prisma.paymentMethod.findMany({
    where: { userId },
  });

  const isPrimary = existingMethods.length === 0;

  const newMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      type,
      provider: provider || null,
      upiId: upiId || null,
      cardLast4: cardLast4 || null,
      cardNetwork: cardNetwork || null,
      expiryMonth: expiryMonth || null,
      expiryYear: expiryYear || null,
      bankAccountId: bankAccountId || null,
      isPrimary,
    },
  });

  return newMethod;
};

/**
 * Update payment method
 */
const updatePaymentMethod = async (methodId, userId, data) => {
  // Verify ownership
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      userId,
    },
  });

  if (!method) {
    throw new Error("Payment method not found or unauthorized");
  }

  const updated = await prisma.paymentMethod.update({
    where: { id: methodId },
    data: {
      ...(data.provider !== undefined && { provider: data.provider }),
      ...(data.upiId !== undefined && { upiId: data.upiId }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });

  return updated;
};

/**
 * Delete payment method
 */
const deletePaymentMethod = async (methodId, userId) => {
  // Verify ownership
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      userId,
    },
  });

  if (!method) {
    throw new Error("Payment method not found or unauthorized");
  }

  // If this was primary, make another method primary
  if (method.isPrimary) {
    const otherMethods = await prisma.paymentMethod.findMany({
      where: {
        userId,
        id: { not: methodId },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (otherMethods.length > 0) {
      await prisma.paymentMethod.update({
        where: { id: otherMethods[0].id },
        data: { isPrimary: true },
      });
    }
  }

  await prisma.paymentMethod.delete({
    where: { id: methodId },
  });

  return { message: "Payment method deleted successfully" };
};

/**
 * Set primary payment method
 */
const setPrimaryPaymentMethod = async (methodId, userId) => {
  // Verify ownership
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      userId,
    },
  });

  if (!method) {
    throw new Error("Payment method not found or unauthorized");
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Remove primary from all methods
    prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isPrimary: false },
    }),
    // Set this method as primary
    prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isPrimary: true },
    }),
  ]);

  return { message: "Primary payment method set successfully" };
};

module.exports = {
  getUserPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setPrimaryPaymentMethod,
};
