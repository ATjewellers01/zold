import prisma from "../config/db.js";

export const updateMetalPriceService = async (userId, metalPrices) => {
    const { gold = {}, silver = {} } = metalPrices;
    if (!gold.buyRate && !gold.sellRate && !silver.buyRate && !silver.sellRate) {
        throw new Error("Price not specified");
    }

    const updatedRates = await prisma.$transaction(async (tx) => {
        const [goldRate, silverRate] = await Promise.all([
            gold.buyRate && gold.sellRate ?
                tx.metalRate.upsert({
                    where: {
                        metal_createdBy_source_isActive: {
                            metal: "GOLD",
                            createdBy: userId,
                            source: "ADMIN",
                            isActive: true
                        }
                    },
                    update: { buyRate: gold.buyRate, sellRate: gold.sellRate },
                    create: {
                        metal: "GOLD",
                        buyRate: gold.buyRate,
                        sellRate: gold.sellRate,
                        isActive: true,
                        createdBy: userId,
                        source: "ADMIN"
                    }
                })

            : undefined,
            
            silver.buyRate && silver.sellRate ?
                tx.metalRate.upsert({
                    where: {
                        metal_createdBy_source_isActive: {
                            metal: "SILVER",
                            createdBy: userId,
                            isActive: true,
                            source: "ADMIN"
                        }
                    },
                    update: {
                        buyRate: silver.buyRate,
                        sellRate: silver.sellRate
                    },
                    create: {
                        metal: "SILVER",
                        buyRate: silver.buyRate,
                        sellRate: silver.sellRate,
                        isActive: true,
                        createdBy: userId,
                        source: "ADMIN"
                    }
                })
            :
            undefined
        ]);

        return { goldRate, silverRate };
    });

    return updatedRates;
};