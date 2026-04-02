import prisma from "../config/db";

export const clearOldSessionsService = async () => {
    const now = new Date();
    try {
        await Promise.all([
            prisma.coinPurchaseSession.deleteMany({
                where: {
                    expires_at: { lt: now },
                    status: { not: "COMPLETED" },
                }
            }),

            prisma.metalPurchaseSession.deleteMany({
                where: {
                    expires_at: { lt: now },
                    status: { not: "COMPLETED" },
                }
            })
        ]);
    }
    catch (error) {
        throw new Error("Session cleanup failed");
    }
};