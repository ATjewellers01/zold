import prisma from "../config/db.js";

import { getGoldLivePrice } from "./gold_api.service.js";
import { getSilverLivePrice } from "./silver_api_service.js";

export const getCurrentGoldRate = async () => {
  const adminRate = await prisma.metalRate.findFirst({
    where: { isActive: true, metal: "GOLD", source: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  if (adminRate) {
    return {
      buyRate: Number(adminRate.buyRate),
      sellRate: Number(adminRate.sellRate),
      source: "admin",
    };
  }

  const liveRate = await getGoldLivePrice();
  if (!liveRate || liveRate.buyRate <= 0) {
    throw new Error("Gold price is not available");
  }

  return liveRate;
};

export const getCurrentSilverRate = async () => {
  const adminRate = await prisma.metalRate.findFirst({
    where: { isActive: true, metal: "SILVER", source: "ADMIN" },
    orderBy: { createdAt: "desc" },
  });

  if (adminRate) {
    return {
      buyRate: Number(adminRate.buyRate),
      sellRate: Number(adminRate.sellRate),
      source: "admin",
    };
  }

  const liveRate = await getSilverLivePrice();
  if (!liveRate || liveRate.buyRate <= 0) {
    throw new Error("Silver price is not available");
  }

  return liveRate;
};

export const updateMetalRate = async (
  metal: "GOLD" | "SILVER",
  buyRate: number,
  sellRate: number,
  userId: string,
) => {
  await prisma.metalRate.updateMany({
    where: { metal, source: "ADMIN", isActive: true },
    data: { isActive: false },
  });

  return prisma.metalRate.create({
    data: {
      metal,
      buyRate,
      sellRate,
      source: "ADMIN",
      isActive: true,
      createdBy: userId,
    },
  });
};

export const getMetalRateHistory = async (
  metal?: "GOLD" | "SILVER",
  limit = 10,
) => {
  return prisma.metalRate.findMany({
    where: metal ? { metal } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
};
