import prisma from "../config/db";
import { PaymentMethod, BankAccount } from "../../generated/prisma";

interface PaymentMethodsResult {
  paymentMethods: PaymentMethod[];
  bankAccounts: BankAccount[];
}

interface AddPaymentMethodData {
  type: string;
  provider?: string;
  upiId?: string;
  cardLast4?: string;
  cardNetwork?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankAccountId?: string;
}

interface UpdatePaymentMethodData {
  provider?: string;
  upiId?: string;
  isActive?: boolean;
}

/**
 * Get all payment methods for a user
 */
export const getUserPaymentMethods = async (
  userId: string,
): Promise<PaymentMethodsResult> => {
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return {
    paymentMethods,
    bankAccounts,
  };
};

/**
 * Add a new payment method
 */
export const addPaymentMethod = async (
  userId: string,
  methodData: AddPaymentMethodData,
): Promise<PaymentMethod> => {
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
export const updatePaymentMethod = async (
  methodId: string,
  userId: string,
  data: UpdatePaymentMethodData,
): Promise<PaymentMethod> => {
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
export const deletePaymentMethod = async (
  methodId: string,
  userId: string,
): Promise<{ message: string }> => {
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      userId,
    },
  });

  if (!method) {
    throw new Error("Payment method not found or unauthorized");
  }

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
export const setPrimaryPaymentMethod = async (
  methodId: string,
  userId: string,
): Promise<{ message: string }> => {
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      userId,
    },
  });

  if (!method) {
    throw new Error("Payment method not found or unauthorized");
  }

  await prisma.$transaction([
    prisma.paymentMethod.updateMany({
      where: { userId },
      data: { isPrimary: false },
    }),
    prisma.paymentMethod.update({
      where: { id: methodId },
      data: { isPrimary: true },
    }),
  ]);

  return { message: "Primary payment method set successfully" };
};
