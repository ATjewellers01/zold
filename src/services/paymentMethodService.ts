import prisma from "../config/db.js";
import { PaymentMethod, BankAccount } from "../../generated/prisma/index.js";

interface PaymentMethodsResult {
  bankAccounts: BankAccount[];
  upiMethods: PaymentMethod[];
}

interface AddBankAccountData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType?: string;
  isPrimary?: boolean;
}

interface AddUpiData {
  upiId: string;
  isPrimary?: boolean;
}

/**
 * Get all payment methods for a user
 */
export const getPaymentMethods = async (
  userId: string,
): Promise<PaymentMethodsResult> => {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  const upiMethods = await prisma.paymentMethod.findMany({
    where: {
      userId,
      type: "UPI",
    },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return {
    bankAccounts,
    upiMethods,
  };
};

/**
 * Add a new bank account
 */
export const addBankAccount = async (
  userId: string,
  data: AddBankAccountData,
): Promise<BankAccount> => {
  const {
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    accountType,
    isPrimary,
  } = data;

  if (isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType: accountType || "SAVINGS",
      isPrimary: isPrimary || false,
    },
  });

  return bankAccount;
};

/**
 * Add a new UPI method
 */
export const addUpiMethod = async (
  userId: string,
  data: AddUpiData,
): Promise<PaymentMethod> => {
  const { upiId, isPrimary } = data;

  if (isPrimary) {
    await prisma.paymentMethod.updateMany({
      where: { userId, type: "UPI", isPrimary: true },
      data: { isPrimary: false },
    });
  }

  const upiMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      type: "UPI",
      upiId,
      isPrimary: isPrimary || false,
    },
  });

  return upiMethod;
};

/**
 * Set a bank account as primary
 */
export const setPrimaryBankAccount = async (
  userId: string,
  accountId: string,
): Promise<BankAccount> => {
  await prisma.bankAccount.updateMany({
    where: { userId, isPrimary: true },
    data: { isPrimary: false },
  });

  const bankAccount = await prisma.bankAccount.update({
    where: {
      id: accountId,
      userId,
    },
    data: { isPrimary: true },
  });

  return bankAccount;
};

/**
 * Set a UPI method as primary
 */
export const setPrimaryUpiMethod = async (
  userId: string,
  methodId: string,
): Promise<PaymentMethod> => {
  await prisma.paymentMethod.updateMany({
    where: { userId, type: "UPI", isPrimary: true },
    data: { isPrimary: false },
  });

  const upiMethod = await prisma.paymentMethod.update({
    where: {
      id: methodId,
      userId,
    },
    data: { isPrimary: true },
  });

  return upiMethod;
};

/**
 * Delete a bank account
 */
export const deleteBankAccount = async (
  userId: string,
  accountId: string,
): Promise<BankAccount> => {
  const bankAccount = await prisma.bankAccount.delete({
    where: {
      id: accountId,
      userId,
    },
  });

  return bankAccount;
};

/**
 * Delete a UPI method
 */
export const deleteUpiMethod = async (
  userId: string,
  methodId: string,
): Promise<PaymentMethod> => {
  const upiMethod = await prisma.paymentMethod.delete({
    where: {
      id: methodId,
      userId,
    },
  });

  return upiMethod;
};
