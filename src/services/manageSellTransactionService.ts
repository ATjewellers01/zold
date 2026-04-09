import prisma from "../config/db.js"

export const approveSellTransactionService = async (transactionId: string, adminId: string) => {
    const transaction = await prisma.metalTransaction.findFirst({
        where: { id: transactionId, transactionType: "SELL", status: "PENDING" }
    });

    if(!transaction) {
        throw new Error("Transaction not found");
    }

    const approve = await prisma.$transaction(async (tx) => {
        await tx.metalTransaction.update({
            where: { id: transactionId },
            data: { status: "COMPLETED", remark: `Approved by admin ${adminId}` }
        })

        const updatedTestWallet = await tx.testWallet.upsert({
            where: { userId: transaction.user_id },
            update: { virtualBalance: { increment: transaction.finalAmount }},
            create: {
                userId: transaction.user_id,
                virtualBalance: transaction.finalAmount,
                createdAt: new Date()
            }
        })

        return updatedTestWallet;
    });

    return { approve }
};

export const rejectSellTransactionService = async (transactionId: string, remark: string, adminId: string) => {
    const transaction = await prisma.metalTransaction.findFirst({
        where: { id: transactionId, transactionType: "SELL", status: "PENDING" }
    });

    if(!transaction) {
        throw new Error("Transaction not found");
    }

    const reject = await prisma.$transaction(async (tx) => {
        const updatedStatus = await tx.metalTransaction.update({
            where: { id: transactionId },
            data: { status: "REJECTED", remark: remark || `Rejected by admin ${adminId}` }
        });

        const updatedWallet = await tx.inventory.update({
            where: { userId: transaction.user_id },
            data: transaction.metalType === "GOLD"
            ? { goldBalance: { increment: transaction.metalGrams } }
            : { silverBalance: { increment: transaction.metalGrams } }
        });

        return { updatedStatus, updatedWallet };
    });

    return reject;
};
