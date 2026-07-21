import prisma from "../config/db.js";

export const clearOldSessionsService = async () => {
    const now = new Date();
    try {
        const [coin, metal] = await Promise.all([
            prisma.coinPurchaseSession.deleteMany({
                where: {
                    expires_at: { lt: now },
                    status: { notIn: ["COMPLETED"] },
                }
            }),
            prisma.metalPurchaseSession.deleteMany({
                where: {
                    expires_at: { lt: now },
                    status: { notIn: ["COMPLETED"] },
                }
            })
        ]);
        if (coin.count > 0 || metal.count > 0) {
            console.log(`[Scheduler] Deleted ${coin.count} expired coin session(s), ${metal.count} expired metal session(s)`);
        }
    }
    catch (error) {
        throw new Error(`Session cleanup failed: ${(error as any).message}`);
    }
};