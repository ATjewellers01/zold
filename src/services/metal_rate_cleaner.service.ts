import prisma from "../config/db.js"

export const clearIncativeMetalRate = async () => {
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    try {
        await prisma.metalRate.deleteMany({
            where: { isActive: false, createdBy: "ADMIN",
                createdAt: { lt: new Date(Date.now() - oneWeek) }
            }
        });
    }
    catch(error) {
        console.log(error)
        throw new Error("Metal rate cleanup failed");
    }
}