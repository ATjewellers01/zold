const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Get all bank accounts for a user
 */
const getUserBankAccounts = async (userId) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return accounts;
};

/**
 * Add a new bank account
 */
const addBankAccount = async (userId, accountData) => {
  const { accountHolderName, bankName, accountNumber, ifscCode, accountType, branch } = accountData;

  // Check if this is the first account - make it primary
  const existingAccounts = await prisma.bankAccount.findMany({
    where: { userId }
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
      isPrimary
    }
  });

  return newAccount;
};

/**
 * Update bank account
 */
const updateBankAccount = async (accountId, userId, data) => {
  // Verify ownership
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId
    }
  });

  if (!account) {
    throw new Error('Bank account not found or unauthorized');
  }

  const updated = await prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      ...(data.accountHolderName && { accountHolderName: data.accountHolderName }),
      ...(data.bankName && { bankName: data.bankName }),
      ...(data.ifscCode && { ifscCode: data.ifscCode }),
      ...(data.accountType && { accountType: data.accountType }),
      ...(data.branch !== undefined && { branch: data.branch })
    }
  });

  return updated;
};

/**
 * Delete bank account
 */
const deleteBankAccount = async (accountId, userId) => {
  // Verify ownership
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId
    }
  });

  if (!account) {
    throw new Error('Bank account not found or unauthorized');
  }

  // If this was primary, make another account primary
  if (account.isPrimary) {
    const otherAccounts = await prisma.bankAccount.findMany({
      where: {
        userId,
        id: { not: accountId }
      },
      orderBy: { createdAt: 'asc' },
      take: 1
    });

    if (otherAccounts.length > 0) {
      await prisma.bankAccount.update({
        where: { id: otherAccounts[0].id },
        data: { isPrimary: true }
      });
    }
  }

  await prisma.bankAccount.delete({
    where: { id: accountId }
  });

  return { message: 'Bank account deleted successfully' };
};

/**
 * Set primary bank account
 */
const setPrimaryBankAccount = async (accountId, userId) => {
  // Verify ownership
  const account = await prisma.bankAccount.findFirst({
    where: {
      id: accountId,
      userId
    }
  });

  if (!account) {
    throw new Error('Bank account not found or unauthorized');
  }

  // Use transaction to ensure atomicity
  await prisma.$transaction([
    // Remove primary from all accounts
    prisma.bankAccount.updateMany({
      where: { userId },
      data: { isPrimary: false }
    }),
    // Set this account as primary
    prisma.bankAccount.update({
      where: { id: accountId },
      data: { isPrimary: true }
    })
  ]);

  return { message: 'Primary account set successfully' };
};

module.exports = {
  getUserBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryBankAccount
};
