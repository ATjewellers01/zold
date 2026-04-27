import bcrypt from "bcryptjs";
import prisma from "../config/db.js"

export const registerPartnerService = async (
    name: string,
    username: string,
    email: string,
    password: string,
    phone: string
) => {

    const exists = await prisma.user.findFirst({
        where: {
            OR: [
                { username, email }
            ]
        }
    });

    if(exists) {
        throw new Error("Username or email already exists");
    }

    const hashPassword = await bcrypt.hash(password, 10);

    return await prisma.user.create({
        data: {
            name,
            username,
            email,
            password: hashPassword,
            phone,
            role: "PARTNER"
        }
    });
};

export const addParterDetailsService = async (
    userId: string,
    businessName: string,
    ownerName: string,
    servicesOffers: "JEWELLERY" | "PICKUP" | "LOAN",
    area: string,
    city: string,
    fullAddress: string,
    pincode: string,
    timings: string,
    latitude: string,
    longitude: string
) => {
    const userExists = await prisma.user.findUnique({ where: { id: userId } });
    if(!userExists) {
        throw new Error("User not found");
    }

    const result = await prisma.partner.create({
        data: {
            userId,
            business_name: businessName,
            owner_name: ownerName,
            services_offers: servicesOffers,
            area,
            city,
            full_address: fullAddress,
            pincode,
            timings,
            latitude,
            longitude
        }
    });

    return result;
};

export const getPartnersByLocationService = async (city?: string) => {
    const result = await prisma.partner.findMany({
        where: city ? { city: { equals: city } } : undefined
    });

    return result;
};

export const getPartnerDetailsService = async (userId: string) => {
    const result = await prisma.partner.findMany({
        where: { userId }
    });

    return result;
};