import prisma from "../config/db.js";
import { BankAccount } from "../../generated/prisma/index.js";

interface BankAccountData {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  branch?: string;
}

interface UpdateBankAccountData {
  accountHolderName?: string;
  bankName?: string;
  ifscCode?: string;
  accountType?: string;
  branch?: string;
}

/**
 * Get all bank accounts for a user
 */
export const getUserBankAccounts = async (
  userId: string,
): Promise<BankAccount[]> => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });

  return accounts;
};

/**
 * Add a new bank account
 */
export const addBankAccount = async (
  userId: string,
  accountData: BankAccountData,
): Promise<BankAccount> => {
  const {
    accountHolderName,
    bankName,
    accountNumber,
    ifscCode,
    accountType,
    branch,
  } = accountData;

  const existingAccounts = await prisma.bankAccount.findMany({
    where: { userId },
  });

  const isPrimary = existingAccounts.length === 0;

  const newAccount = await prisma.bankAccount.create({
    data: {
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      branch: branch || null,
      isPrimary,
    },
  });

  return newAccount;
};

/**
 * Update bank account
 */
export const updateBankAccount = async (
  accountId: string,
  userId: string,
  data: UpdateBankAccountData,
): Promise<BankAccount> => {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error("Bank account not found or unauthorized");
  }

  const updated = await prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      ...(data.accountHolderName && {
        accountHolderName: data.accountHolderName,
      }),
      ...(data.bankName && { bankName: data.bankName }),
      ...(data.ifscCode && { ifscCode: data.ifscCode }),
      ...(data.accountType && { accountType: data.accountType }),
      ...(data.branch !== undefined && { branch: data.branch }),
    },
  });

  return updated;
};

/**
 * Delete bank account
 */
export const deleteBankAccount = async (
  accountId: string,
  userId: string,
): Promise<{ message: string }> => {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error("Bank account not found or unauthorized");
  }

  if (account.isPrimary) {
    const otherAccounts = await prisma.bankAccount.findMany({
      where: {
        userId,
        id: { not: accountId },
      },
      orderBy: { createdAt: "asc" },
      take: 1,
    });

    if (otherAccounts.length > 0) {
      await prisma.bankAccount.update({
        where: { id: otherAccounts[0].id },
        data: { isPrimary: true },
      });
    }
  }

  await prisma.bankAccount.delete({
    where: { id: accountId },
  });

  return { message: "Bank account deleted successfully" };
};

/**
 * Set primary bank account
 */
export const setPrimaryBankAccount = async (
  accountId: string,
  userId: string,
): Promise<{ message: string }> => {
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId,
    },
  });

  if (!account) {
    throw new Error("Bank account not found or unauthorized");
  }

  await prisma.$transaction([
    prisma.bankAccount.updateMany({
      where: { userId },
      data: { isPrimary: false },
    }),
    prisma.bankAccount.update({
      where: { id: accountId },
      data: { isPrimary: true },
    }),
  ]);

  return { message: "Primary account set successfully" };
};
