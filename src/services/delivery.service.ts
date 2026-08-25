import prisma from "../config/db.js"
import { Resend } from "resend";

import { ApiError } from "../utils/error_class.js";
import { generateOtp } from "../utils/otp.js";
import { resend, sendOTP } from "./email.service.js";

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
            data: { 
                userId, 
                partnerId, 
                metal, 
                coin_grams: coinGrams, 
                quantity, 
                addressOfDelivery: deliveryAddress 
            }
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

export const completeDeliveryService = async (userId: string, deliveryId: string) => {
    const validDelivery = await prisma.delivery.findUnique({ where: {id: deliveryId} });
    if ((validDelivery) &&
        (validDelivery.status === "CANCELLED" || validDelivery.status === "DELIVERED")) {
        throw new ApiError(400, `The delivery is already ${validDelivery.status}`);
    }

    if (!validDelivery) {
        throw new ApiError(400, "Invalid Delivery");
    }

    const validPartner = await prisma.partner.findUnique({ where: { userId } });
    if (!validPartner) {
        throw new ApiError(400, "You are not a registered partner");
    }

    if (validPartner.id !== validDelivery.partnerId) {
        throw new ApiError(400, "You are not assigned to this delivery");
    }

    const customerId = validDelivery.userId;
    const customerInfo = await prisma.user.findUnique({ where: { id: customerId } });
    if (!customerInfo) {
        throw new ApiError(400, "Invalid customer");
    }

    const customerEmail = customerInfo.email;
    const otp = parseInt(generateOtp());

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || "zold@support.zold.in",
        to: customerEmail,
        subject: `Your delivery of ${validDelivery.metal} coin confirmation OTP`,
        html: `<h2>Confirm your delivery</h2>
        <p>Hi ${customerInfo.username},</p>
        <p>Your One-Time Password (OTP) for confirming your delivery is:</p>
        <h1 style="color: #3D3066; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>Please, give this OTP to delivery partner, make sure, 
        you receive your order after giving this otp, as this will mark your delivery confirmed</p>
        <br/>`
    });

    if(error) {
        throw new ApiError(500, error.message);
    }

    await prisma.delivery.update({
        where: { id: deliveryId },
        data: { otp }
    });

    return otp;
};

export const verifyDeliveryService = async (userId: string, deliveryId: string, otp: number) => {
    const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });

    if (!delivery) {
        throw new ApiError(400, "Invalid delivery");
    }

    if (delivery.otp !== otp) {
        throw new ApiError(400, "Invalid OTP");
    }

    await prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: "DELIVERED", completionDate: new Date() }
    });
};
