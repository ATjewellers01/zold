import prisma from "../config/db"

export const getUserTransactionsService = async (userId: string) => {
    const [metalTransactions, coinTransactions] = await Promise.all([
        prisma.metalTransaction.findMany({
            where: { user_id: userId },
            orderBy: { createdAt: "desc" }
        }),

        prisma.coinTransaction.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" }
        })
    ]);

    return { metalTransactions, coinTransactions };
};

export const getUserSellTransactionHistoryService = async () => {
    const [metalSellTransactions, coinSellTransactions] = await Promise.all([
        prisma.metalTransaction.findMany({
            where: { transactionType: "SELL" },
            orderBy: { createdAt: "desc" },
            include: { user: true }
        }),

        prisma.coinTransaction.findMany({
            where: { type: "SELL" },
            orderBy: { created_at: "desc" },
            include: { user: true }
        })
    ]);

    return { metalSellTransactions, coinSellTransactions };
};