import prisma from "../config/db.js"
import { ApiError } from "../utils/error_class.js";

export const initiateDeliveryService = async (userId: string, deliveryDetails) => {
    const { metal, coinGrams, quantity, partnerId, deliveryAddress } = deliveryDetails;
    const deliverablesExists = await prisma.coinTransaction.findFirst({
        where: {
            user_id: userId,
            metal,
            weight: coinGrams,
            quantity,
            status: "COMPLETED",
            OR: [
                { delivery: null },
                { delivery: { status: "CANCELLED" } }
            ]
        }
    });

    if(!deliverablesExists) {
        throw new ApiError(400, `You have already an ongoing delivery for this ${metal} coin`);
    }

    const result = await prisma.delivery.create({
        data: {
            userId,
            partnerId,
            coin_transaction_id: deliverablesExists.id,
            metal: metal,
            coin_grams: coinGrams,
            quantity,
            addressOfDelivery: deliveryAddress
        }
    });

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

    return await prisma.delivery.update({
        where: { id: deliveryId, partnerId },
        data: {
            tentativeDate: new Date(tentativeDate)
        }
    });
};