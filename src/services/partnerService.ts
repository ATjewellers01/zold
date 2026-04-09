import prisma from "../config/db.js";
import bcrypt from "bcryptjs";

const parsePartner = (partner: any) => ({
  ...partner,
  services: JSON.parse(partner.services || "[]"),
  offers: JSON.parse(partner.offers || "[]"),
});

export const getAllPartnersService = async (city?: string, isActive?: boolean) => {
  const where: any = {};
  if (city) where.city = city;
  if (isActive !== undefined) where.isActive = isActive;

  const partners = await prisma.partner.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isVerified: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return partners.map(parsePartner);
};

export const getPartnerByIdService = async (id: string) => {
  const partner = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          username: true,
          isVerified: true,
        },
      },
    },
  });

  if (!partner) throw new Error("Partner not found");

  return parsePartner(partner);
};

export const createPartnerService = async (data: {
  name: string;
  area: string;
  city: string;
  state?: string;
  country?: string;
  latitude: number;
  longitude: number;
  distance?: number;
  phone: string;
  email?: string;
  website?: string;
  rating?: number;
  reviews?: number;
  timings: string;
  services?: any[];
  offers?: any[];
  description?: string;
  isActive?: boolean;
  isVerified?: boolean;
}) => {
  const partner = await prisma.partner.create({
    data: {
      name: data.name,
      area: data.area,
      city: data.city,
      state: data.state || "Chhattisgarh",
      country: data.country || "India",
      latitude: parseFloat(String(data.latitude)),
      longitude: parseFloat(String(data.longitude)),
      distance: data.distance ? parseFloat(String(data.distance)) : 0,
      phone: data.phone,
      email: data.email,
      website: data.website,
      rating: data.rating ? parseFloat(String(data.rating)) : 0,
      reviews: data.reviews ? parseInt(String(data.reviews)) : 0,
      timings: data.timings,
      services: JSON.stringify(data.services || []),
      offers: JSON.stringify(data.offers || []),
      description: data.description,
      isActive: data.isActive !== undefined ? data.isActive : true,
      isVerified: data.isVerified || false,
    },
  });

  return parsePartner(partner);
};

export const createPartnerAccountService = async (data: {
  businessName: string;
  ownerName: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  area?: string;
  city: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  timings?: string;
  services?: any[];
  commission?: number;
  bankAccount?: string;
  website?: string;
  description?: string;
}) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: data.username }, { email: data.email }],
    },
  });

  if (existingUser) throw new Error("Username or email already exists");

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.ownerName,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      phone: data.phone,
      role: "PARTNER",
      isVerified: true,
    },
  });

  await prisma.inventory.create({
    data: {
      userId: user.id,
      goldBalance: 0,
      pledgedGold: 0,
      rupeeBalance: 0,
    },
  });

  const partner = await prisma.partner.create({
    data: {
      name: data.businessName,
      area: data.area || data.city,
      city: data.city,
      state: data.state || "Chhattisgarh",
      country: "India",
      latitude: data.latitude ? parseFloat(String(data.latitude)) : 0,
      longitude: data.longitude ? parseFloat(String(data.longitude)) : 0,
      phone: data.phone,
      email: data.email,
      website: data.website || null,
      timings: data.timings || "10:00 AM - 8:00 PM",
      services: JSON.stringify(data.services || ["jewellery"]),
      offers: JSON.stringify([]),
      description: data.description || null,
      commission: data.commission ? parseFloat(String(data.commission)) : 2.0,
      bankAccount: data.bankAccount || null,
      userId: user.id,
      isActive: true,
      isVerified: true,
    },
  });

  return {
    partner: {
      ...parsePartner(partner),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    },
    credentials: {
      username: data.username,
      password: data.password,
    },
  };
};

export const updatePartnerService = async (id: string, updateData: any) => {
  const data: any = { ...updateData };

  if (data.services) data.services = JSON.stringify(data.services);
  if (data.offers) data.offers = JSON.stringify(data.offers);
  if (data.latitude) data.latitude = parseFloat(data.latitude);
  if (data.longitude) data.longitude = parseFloat(data.longitude);
  if (data.distance) data.distance = parseFloat(data.distance);
  if (data.rating) data.rating = parseFloat(data.rating);
  if (data.reviews) data.reviews = parseInt(data.reviews);
  if (data.commission) data.commission = parseFloat(data.commission);

  const partner = await prisma.partner.update({
    where: { id },
    data,
  });

  return parsePartner(partner);
};

export const deletePartnerService = async (id: string) => {
  return prisma.partner.delete({
    where: { id },
  });
};

export const searchPartnersService = async (query: string) => {
  const partners = await prisma.partner.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { area: { contains: query, mode: "insensitive" } },
      ],
      isActive: true,
    },
    orderBy: { rating: "desc" },
  });

  return partners.map(parsePartner);
};
