const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Get all payment methods for a user
 */
const getPaymentMethods = async (userId) => {
  const bankAccounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  const upiMethods = await prisma.paymentMethod.findMany({
    where: { 
      userId,
      type: 'UPI'
    },
    orderBy: [
      { isPrimary: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return {
    bankAccounts,
    upiMethods
  };
};

/**
 * Add a new bank account
 */
const addBankAccount = async (userId, data) => {
  const { accountHolderName, bankName, accountNumber, ifscCode, accountType, isPrimary } = data;

  // If this is set as primary, unset other primary accounts
  if (isPrimary) {
    await prisma.bankAccount.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false }
    });
  }

  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId,
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType: accountType || 'SAVINGS',
      isPrimary: isPrimary || false
    }
  });

  return bankAccount;
};

/**
 * Add a new UPI method
 */
const addUpiMethod = async (userId, data) => {
  const { upiId, isPrimary } = data;

  // If this is set as primary, unset other primary UPI methods
  if (isPrimary) {
    await prisma.paymentMethod.updateMany({
      where: { userId, type: 'UPI', isPrimary: true },
      data: { isPrimary: false }
    });
  }

  const upiMethod = await prisma.paymentMethod.create({
    data: {
      userId,
      type: 'UPI',
      upiId,
      isPrimary: isPrimary || false
    }
  });

  return upiMethod;
};

/**
 * Set a bank account as primary
 */
const setPrimaryBankAccount = async (userId, accountId) => {
  // Unset all primary accounts
  await prisma.bankAccount.updateMany({
    where: { userId, isPrimary: true },
    data: { isPrimary: false }
  });

  // Set the selected account as primary
  const bankAccount = await prisma.bankAccount.update({
    where: { 
      id: accountId,
      userId // Ensure user owns this account
    },
    data: { isPrimary: true }
  });

  return bankAccount;
};

/**
 * Set a UPI method as primary
 */
const setPrimaryUpiMethod = async (userId, methodId) => {
  // Unset all primary UPI methods
  await prisma.paymentMethod.updateMany({
    where: { userId, type: 'UPI', isPrimary: true },
    data: { isPrimary: false }
  });

  // Set the selected method as primary
  const upiMethod = await prisma.paymentMethod.update({
    where: { 
      id: methodId,
      userId
    },
    data: { isPrimary: true }
  });

  return upiMethod;
};

/**
 * Delete a bank account
 */
const deleteBankAccount = async (userId, accountId) => {
  const bankAccount = await prisma.bankAccount.delete({
    where: { 
      id: accountId,
      userId
    }
  });

  return bankAccount;
};

/**
 * Delete a UPI method
 */
const deleteUpiMethod = async (userId, methodId) => {
  const upiMethod = await prisma.paymentMethod.delete({
    where: { 
      id: methodId,
      userId
    }
  });

  return upiMethod;
};

module.exports = {
  getPaymentMethods,
  addBankAccount,
  addUpiMethod,
  setPrimaryBankAccount,
  setPrimaryUpiMethod,
  deleteBankAccount,
  deleteUpiMethod
};
