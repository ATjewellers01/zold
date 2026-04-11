import prisma from "../config/db.js"

export const approveSellTransactionService = async (transactionId: string, adminId: string) => {
    // Atomic guard: if two admins click approve simultaneously, only one wins
    const updateResult = await prisma.metalTransaction.updateMany({
        where: { id: transactionId, transactionType: "SELL", status: "PENDING" },
        data: { status: "COMPLETED", remark: `Approved by admin ${adminId}` }
    });

    if (updateResult.count === 0) {
        const existing = await prisma.metalTransaction.findUnique({ where: { id: transactionId } });
        if (!existing) throw new Error("Transaction not found");
        throw new Error(`Transaction is already ${existing.status.toLowerCase()}`);
    }

    const transaction = await prisma.metalTransaction.findUnique({ where: { id: transactionId } });
    return { transaction };
};

export const rejectSellTransactionService = async (transactionId: string, remark: string, adminId: string) => {
    const transaction = await prisma.metalTransaction.findFirst({
        where: { id: transactionId, transactionType: "SELL", status: "PENDING" }
    });

    if (!transaction) {
        const existing = await prisma.metalTransaction.findUnique({ where: { id: transactionId } });
        if (!existing) throw new Error("Transaction not found");
        throw new Error(`Transaction is already ${existing.status.toLowerCase()}`);
    }

    return await prisma.$transaction(async (tx) => {
        // Atomic guard: prevents double-rejection restoring balance twice
        const updateResult = await tx.metalTransaction.updateMany({
            where: { id: transactionId, transactionType: "SELL", status: "PENDING" },
            data: { status: "REJECTED", remark: remark || `Rejected by admin ${adminId}` }
        });

        if (updateResult.count === 0) {
            throw new Error("Already processed");
        }

        // Return the metal to the user's inventory
        const updatedInventory = await tx.inventory.update({
            where: { userId: transaction.user_id },
            data: transaction.metalType === "GOLD"
                ? { goldBalance: { increment: transaction.metalGrams } }
                : { silverBalance: { increment: transaction.metalGrams } }
        });

        return {
            transaction: { ...transaction, status: "REJECTED" as const },
            inventory: updatedInventory
        };
    });
};
