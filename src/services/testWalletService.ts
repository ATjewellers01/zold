import prisma from "../config/db.js";
import { PrismaClient, TestWallet } from "../../generated/prisma/index.js";

type TransactionClient = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

export const getOrCreateTestWallet = async (
  tx: TransactionClient,
  userId: string,
): Promise<TestWallet> => {
  let testWallet = await tx.testWallet.findUnique({ where: { userId } });

  if (!testWallet) {
    testWallet = await tx.testWallet.create({
      data: { userId, virtualBalance: 10000 },
    });
  }

  return testWallet;
};

export const getTestWallet = async (userId: string): Promise<TestWallet> => {
  let testWallet = await prisma.testWallet.findUnique({
    where: { userId: userId },
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

export const addTestCredits = async (
  userId: string,
  amount: number = 10000,
): Promise<TestWallet> => {
  await getTestWallet(userId);

  return prisma.testWallet.update({
    where: { userId },
    data: {
      virtualBalance: { increment: amount },
    },
  });
};

export const resetTestWallet = async (userId: string): Promise<TestWallet> => {
  await getTestWallet(userId);

  return prisma.testWallet.update({
    where: { userId },
    data: { virtualBalance: 10000 },
  });
};
