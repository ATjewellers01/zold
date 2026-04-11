import prisma from "../config/db.js";

/**
 * Fetches the current active GST rate as a multiplier (e.g., 0.03 for 3%).
 * Fallback to 0.03 if no configuration exists.
 */
export const getCurrentGstRate = async (): Promise<number> => {
    const config = await prisma.gstConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" }
    });
    const ratePercent = config ? Number(config.rate) : 3;
    return ratePercent / 100;
};

/**
 * Fetches the current active GST rate as a whole number (e.g., 3 for 3%).
 * Fallback to 3 if no configuration exists.
 */
export const getCurrentGstRateWhole = async (): Promise<number> => {
    const config = await prisma.gstConfig.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "desc" }
    });
    return config ? Number(config.rate) : 3;
};

/**
 * Updates the GST rate by inserting a new GstConfig record.
 * Validates that the rate is between 0 and 100.
 */
export const updateGstRate = async (rate: number, adminId: string) => {
    if (rate < 0 || rate > 100) {
        throw new Error("GST rate must be between 0 and 100");
    }

    // Deactivate previous active configs (optional but good for clarity)
    await prisma.gstConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false }
    });

    return await prisma.gstConfig.create({
        data: {
            rate: rate,
            updatedBy: adminId,
            isActive: true
        },
        include: {
            admin: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
};

export const getGstHistory = async () => {
    return await prisma.gstConfig.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            admin: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
};
