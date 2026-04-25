import prisma from "../config/db.js"
import { ApiError } from "../utils/error_class.js";

export const initiateDeliveryService = async (userId: string, deliveryDetails) => {
    const { metal, coinGrams, quantity, partnerId, deliveryAddress } = deliveryDetails;

    const coinTransaction = await prisma.coinTransaction.findFirst({
        where: {
            user_id: userId,
            metal,
            weight: coinGrams,
            status: "COMPLETED",
            OR: [
                { delivery: null },
                { delivery: { status: "CANCELLED" } }
            ]
        }
    });

    if(coinTransaction && coinTransaction.quantity < quantity) {
        throw new ApiError(400, `You do not have sufficient ${metal} Coin Balance, please purchase and try again`);
    }

    if (!coinTransaction) {
        throw new ApiError(400, `You already have an ongoing delivery for this ${metal} coin`);
    }

    const result = await prisma.delivery.upsert({
        where: { coin_transaction_id: coinTransaction.id },
        create: {
            userId,
            partnerId,
            coin_transaction_id: coinTransaction.id,
            metal,
            coin_grams: coinGrams,
            quantity,
            addressOfDelivery: deliveryAddress
        },
        update: {
            partnerId,
            addressOfDelivery: deliveryAddress,
            status: "PENDING",
            tentativeDate: null,
            completionDate: null,
        }
    });

    return result;
};

export const cancelDeliveryService = async (
    userId: string,
    deliveryId: string,
) => {
    const result = await prisma.delivery.update({
        where: 
        { 
            id: deliveryId, 
            userId, 
            completionDate: null, 
            status: { not: "CANCELLED" } 
        },
        data: { status: "CANCELLED" }
    });

    if(!result) {
        throw new ApiError(400, "Invalid or Completed delivery");
    }

    return result;
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
        }
    });
};

export const trackPartnerAssignedDeliveryService = async (userId: string) => {
    return await prisma.delivery.findMany({ 
        where: { 
            partner: { 
                userId: userId 
            } 
        },
        include: {
            user: {
                select: {
                    name: true,
                    phone: true
                }
            }
        }
    });
};

export const updatePartnerDeliveryInformationService = async (
    userId: string,
    deliveryId: string,
    tentativeDate: Date
) => {
    const validPartner = await prisma.partner.findUnique({
        where: { userId },
        select: {
            id: true
        }
    });

    if(!validPartner) {
        throw new ApiError(404, "Partner not found");
    }

    const partnerId = validPartner.id;

    const delivery = await prisma.delivery.findUnique({
        where: { id: deliveryId },
        select: { id: true, partnerId: true, status: true }
    });

    if (!delivery || delivery.partnerId !== partnerId) {
        throw new ApiError(404, "Delivery not found");
    }

    if (delivery.status === "CANCELLED" || delivery.status === "DELIVERED") {
        throw new ApiError(400, "Cannot update a Completed or Cancelled delivery");
    }

    return await prisma.delivery.update({
        where: { id: deliveryId },
        data: { tentativeDate: new Date(tentativeDate) }
    });
};