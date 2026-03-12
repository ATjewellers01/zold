import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/db";
import bcrypt from "bcryptjs";

export const getAllPartners = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { city, isActive } = req.query;

    const where: any = {};
    if (city) where.city = city;
    if (isActive !== undefined) where.isActive = isActive === "true";

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

    const parsedPartners = partners.map((partner) => ({
      ...partner,
      services: JSON.parse(partner.services || "[]"),
      offers: JSON.parse(partner.offers || "[]"),
    }));

    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error: any) {
    console.error("Error fetching partners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partners",
      error: error.message,
    });
  }
};

export const getPartnerById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

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

    if (!partner) {
      res.status(404).json({
        success: false,
        message: "Partner not found",
      });
      return;
    }

    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || "[]"),
      offers: JSON.parse(partner.offers || "[]"),
    };

    res.json({
      success: true,
      partner: parsedPartner,
    });
  } catch (error: any) {
    console.error("Error fetching partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch partner",
      error: error.message,
    });
  }
};

export const createPartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      name,
      area,
      city,
      state,
      country,
      latitude,
      longitude,
      distance,
      phone,
      email,
      website,
      rating,
      reviews,
      timings,
      services,
      offers,
      description,
      isActive,
      isVerified,
    } = req.body;

    if (
      !name ||
      !area ||
      !city ||
      !latitude ||
      !longitude ||
      !phone ||
      !timings
    ) {
      res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
      return;
    }

    const partner = await prisma.partner.create({
      data: {
        name,
        area,
        city,
        state: state || "Chhattisgarh",
        country: country || "India",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        distance: distance ? parseFloat(distance) : 0,
        phone,
        email,
        website,
        rating: rating ? parseFloat(rating) : 0,
        reviews: reviews ? parseInt(reviews) : 0,
        timings,
        services: JSON.stringify(services || []),
        offers: JSON.stringify(offers || []),
        description,
        isActive: isActive !== undefined ? isActive : true,
        isVerified: isVerified || false,
      },
    });

    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || "[]"),
      offers: JSON.parse(partner.offers || "[]"),
    };

    res.status(201).json({
      success: true,
      message: "Partner created successfully",
      partner: parsedPartner,
    });
  } catch (error: any) {
    console.error("Error creating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create partner",
      error: error.message,
    });
  }
};

export const createPartnerAccount = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const {
      businessName,
      ownerName,
      username,
      email,
      password,
      phone,
      area,
      city,
      state,
      latitude,
      longitude,
      timings,
      services,
      commission,
      bankAccount,
      website,
      description,
    } = req.body;

    if (
      !businessName ||
      !ownerName ||
      !username ||
      !email ||
      !password ||
      !phone ||
      !city
    ) {
      res.status(400).json({
        success: false,
        message:
          "Missing required fields: businessName, ownerName, username, email, password, phone, city",
      });
      return;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: ownerName,
        username,
        email,
        password: hashedPassword,
        phone,
        role: "PARTNER",
        isVerified: true,
      },
    });

    await prisma.wallet.create({
      data: {
        userId: user.id,
        goldBalance: 0,
        pledgedGold: 0,
        rupeeBalance: 0,
      },
    });

    const partner = await prisma.partner.create({
      data: {
        name: businessName,
        area: area || city,
        city,
        state: state || "Chhattisgarh",
        country: "India",
        latitude: latitude ? parseFloat(latitude) : 0,
        longitude: longitude ? parseFloat(longitude) : 0,
        phone,
        email,
        website: website || null,
        timings: timings || "10:00 AM - 8:00 PM",
        services: JSON.stringify(services || ["jewellery"]),
        offers: JSON.stringify([]),
        description: description || null,
        commission: commission ? parseFloat(commission) : 2.0,
        bankAccount: bankAccount || null,
        userId: user.id,
        isActive: true,
        isVerified: true,
      },
    });

    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services),
      offers: JSON.parse(partner.offers),
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
      },
    };

    res.status(201).json({
      success: true,
      message: "Partner account created successfully",
      partner: parsedPartner,
      credentials: {
        username,
        password,
      },
    });
  } catch (error: any) {
    console.error("Error creating partner account:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create partner account",
      error: error.message,
    });
  }
};

export const updatePartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: any = { ...req.body };

    if (updateData.services) {
      updateData.services = JSON.stringify(updateData.services);
    }
    if (updateData.offers) {
      updateData.offers = JSON.stringify(updateData.offers);
    }

    if (updateData.latitude)
      updateData.latitude = parseFloat(updateData.latitude);
    if (updateData.longitude)
      updateData.longitude = parseFloat(updateData.longitude);
    if (updateData.distance)
      updateData.distance = parseFloat(updateData.distance);
    if (updateData.rating) updateData.rating = parseFloat(updateData.rating);
    if (updateData.reviews) updateData.reviews = parseInt(updateData.reviews);
    if (updateData.commission)
      updateData.commission = parseFloat(updateData.commission);

    const partner = await prisma.partner.update({
      where: { id },
      data: updateData,
    });

    const parsedPartner = {
      ...partner,
      services: JSON.parse(partner.services || "[]"),
      offers: JSON.parse(partner.offers || "[]"),
    };

    res.json({
      success: true,
      message: "Partner updated successfully",
      partner: parsedPartner,
    });
  } catch (error: any) {
    console.error("Error updating partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update partner",
      error: error.message,
    });
  }
};

export const deletePartner = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.partner.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Partner deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting partner:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete partner",
      error: error.message,
    });
  }
};

export const searchPartners = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { query } = req.query;

    if (!query) {
      res.status(400).json({
        success: false,
        message: "Search query is required",
      });
      return;
    }

    const partners = await prisma.partner.findMany({
      where: {
        OR: [
          { name: { contains: query as string, mode: "insensitive" } },
          { city: { contains: query as string, mode: "insensitive" } },
          { area: { contains: query as string, mode: "insensitive" } },
        ],
        isActive: true,
      },
      orderBy: { rating: "desc" },
    });

    const parsedPartners = partners.map((partner) => ({
      ...partner,
      services: JSON.parse(partner.services || "[]"),
      offers: JSON.parse(partner.offers || "[]"),
    }));

    res.json({
      success: true,
      partners: parsedPartners,
    });
  } catch (error: any) {
    console.error("Error searching partners:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search partners",
      error: error.message,
    });
  }
};
