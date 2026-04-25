import prisma from "../config/db.js"
import { ApiError } from "../utils/error_class.js";

export const initiateDeliveryService = async (userId: string, deliveryDetails) => {
    const { metal, coinGrams, quantity, partnerId, deliveryAddress } = deliveryDetails;

    await prisma.$transaction(async (tx) => {
        const inventory = await tx.coinInventory.findUnique({
            where: { userId_coinGrams_metal: { userId, coinGrams, metal } }
        });

        if (!inventory || inventory.quantity < quantity) {
            throw new ApiError(400, `Not enough ${metal} coins in your inventory`);
        }

        await tx.coinInventory.update({
            where: { userId_coinGrams_metal: { userId, coinGrams, metal } },
            data: { quantity: { decrement: quantity } }
        });

        await tx.delivery.create({
            data: { userId, partnerId, metal, coin_grams: coinGrams, quantity, addressOfDelivery: deliveryAddress }
        });
    });
};

export const cancelDeliveryService = async (userId: string, deliveryId: string) => {
    await prisma.$transaction(async (tx) => {
        const delivery = await tx.delivery.findUnique({
            where: { id: deliveryId },
            select: { id: true, userId: true, metal: true, coin_grams: true, quantity: true, status: true }
        });

        if (!delivery || delivery.userId !== userId) {
            throw new ApiError(404, "Delivery not found");
        }

        if (delivery.status === "CANCELLED" || delivery.status === "DELIVERED") {
            throw new ApiError(400, "Cannot cancel a completed or already cancelled delivery");
        }

        await tx.delivery.update({
            where: { id: deliveryId },
            data: { status: "CANCELLED" }
        });

        await tx.coinInventory.update({
            where: { userId_coinGrams_metal: { userId, coinGrams: delivery.coin_grams, metal: delivery.metal } },
            data: { quantity: { increment: delivery.quantity } }
        });
    });
};

export const trackDeliveryService = async (userId: string) => {
    return await prisma.delivery.findMany({
        where: { userId },
        include: {
            partner: {
                select: {
                    owner_name: true,
                    business_name: true,
                    full_address: true,
                    area: true,
                    city: true,
                    pincode: true,
                    user: {
                        select: { phone: true }
                    }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};

export const trackPartnerAssignedDeliveryService = async (userId: string) => {
    return await prisma.delivery.findMany({
        where: { partner: { userId } },
        include: {
            user: {
                select: { name: true, phone: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
};

export const updatePartnerDeliveryInformationService = async (
    userId: string,
    deliveryId: string,
    tentativeDate: Date
) => {
    const partner = await prisma.partner.findUnique({
        where: { userId },
        select: { id: true }
    });

    if (!partner) {
        throw new ApiError(404, "Partner not found");
    }

    const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { id: true, partnerId: true, status: true }
    });

    if (!delivery || delivery.partnerId !== partner.id) {
        throw new ApiError(404, "Delivery not found");
    }

    if (delivery.status === "CANCELLED" || delivery.status === "DELIVERED") {
        throw new ApiError(400, "Cannot update a completed or cancelled delivery");
    }

    return await prisma.delivery.update({
        where: { id: deliveryId },
        data: { tentativeDate: new Date(tentativeDate) }
    });
};
