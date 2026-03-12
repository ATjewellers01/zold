import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import prisma from "../config/db.js";
import * as goldService from "../services/goldService.js";

export const sendGift = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const senderId = req.user!.id;
    const {
      recipientName,
      recipientPhone,
      amount,
      message,
      occasion,
      giftType = "rupees",
      goldGrams: directGrams,
      coinGrams,
      coinQuantity,
    } = req.body;

    if (!recipientName || !recipientPhone || !occasion) {
      res.status(400).json({
        success: false,
        message: "Recipient name, phone, and occasion are required",
      });
      return;
    }

    if (giftType === "rupees" && !amount) {
      res.status(400).json({
        success: false,
        message: "Amount is required for rupees gift type",
      });
      return;
    }

    if (giftType === "grams" && !directGrams) {
      res.status(400).json({
        success: false,
        message: "Gold grams is required for grams gift type",
      });
      return;
    }

    if (giftType === "coins") {
      if (!coinGrams || !coinQuantity) {
        res.status(400).json({
          success: false,
          message:
            "Coin denomination and quantity are required for coin gift type",
        });
        return;
      }
      if (![1, 2, 5, 10].includes(coinGrams)) {
        res.status(400).json({
          success: false,
          message: "Invalid coin denomination. Must be 1, 2, 5, or 10 grams",
        });
        return;
      }
    }

    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(String(currentRate.buyRate));

    let goldGrams: number, giftAmount: number;

    if (giftType === "rupees") {
      giftAmount = parseFloat(amount);
      goldGrams = giftAmount / goldPrice;
    } else if (giftType === "grams") {
      goldGrams = parseFloat(directGrams);
      giftAmount = goldGrams * goldPrice;
    } else {
      goldGrams = coinGrams * coinQuantity;
      giftAmount = goldGrams * goldPrice;
    }

    const result = await prisma.$transaction(async (tx) => {
      if (giftType === "coins") {
        const coinInventory = await tx.coinInventory.findUnique({
          where: {
            userId_coinGrams: {
              userId: senderId,
              coinGrams: coinGrams,
            },
          },
        });

        if (!coinInventory || coinInventory.quantity < coinQuantity) {
          throw new Error(
            `Insufficient ${coinGrams}g coins. You have ${coinInventory?.quantity || 0} but need ${coinQuantity}.`,
          );
        }

        await tx.coinInventory.update({
          where: {
            userId_coinGrams: {
              userId: senderId,
              coinGrams: coinGrams,
            },
          },
          data: {
            quantity: { decrement: coinQuantity },
          },
        });
      } else {
        const wallet = await tx.wallet.findUnique({
          where: { userId: senderId },
        });

        if (!wallet || parseFloat(String(wallet.goldBalance)) < goldGrams) {
          throw new Error(
            `Insufficient gold balance. You need ${goldGrams.toFixed(3)}g but have ${wallet?.goldBalance || 0}g.`,
          );
        }

        await tx.wallet.update({
          where: { userId: senderId },
          data: {
            goldBalance: { decrement: goldGrams },
          },
        });
      }

      await tx.goldTransaction.create({
        data: {
          userId: senderId,
          type: giftType === "coins" ? "COIN_GIFT_SENT" : "GIFT_SENT",
          goldGrams: goldGrams,
          ratePerGram: goldPrice,
          totalAmount: giftAmount,
          gst: 0,
          finalAmount: giftAmount,
          paymentMode: "WALLET",
          status: "COMPLETED",
          storageType: "vault",
        },
      });

      const gift = await tx.goldGift.create({
        data: {
          senderId,
          recipientName,
          recipientPhone,
          giftType,
          amount: giftAmount,
          goldGrams,
          coinGrams: giftType === "coins" ? coinGrams : null,
          coinQuantity: giftType === "coins" ? coinQuantity : null,
          message,
          occasion,
          status: "PENDING",
        },
      });

      return gift;
    });

    res.json({
      success: true,
      message: `Gold gift sent successfully! ${giftType === "coins" ? `${coinQuantity}x ${coinGrams}g coins` : `${goldGrams.toFixed(3)}g gold`}`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error sending gold gift:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send gold gift",
      error: error.message,
    });
  }
};

export const getSentGifts = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const gifts = await prisma.goldGift.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: gifts,
    });
  } catch (error: any) {
    console.error("Error fetching sent gifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sent gifts",
      error: error.message,
    });
  }
};

export const lookupUserByPhone = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { phone } = req.query;

    if (!phone || (phone as string).length < 10) {
      res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
      return;
    }

    const cleanPhone = (phone as string).replace(/[\s\-\+]/g, "").slice(-10);

    const user = await prisma.user.findFirst({
      where: {
        phone: {
          endsWith: cleanPhone,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
      },
    });

    if (!user) {
      res.json({
        success: true,
        found: false,
        message:
          "No ZOLD user found with this number. They will receive an invite to join.",
      });
      return;
    }

    res.json({
      success: true,
      found: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email
          ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
          : null,
      },
    });
  } catch (error: any) {
    console.error("Error looking up user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lookup user",
      error: error.message,
    });
  }
};

export const getReceivedGifts = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      res.status(400).json({
        success: false,
        message: "User phone number not found",
      });
      return;
    }

    const cleanPhone = user.phone.replace(/[\s\-\+]/g, "").slice(-10);

    const gifts = await prisma.goldGift.findMany({
      where: {
        recipientPhone: {
          endsWith: cleanPhone,
        },
        status: "PENDING",
      },
      include: {
        sender: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: gifts.map((g) => ({
        ...g,
        senderName: g.sender?.name || "Anonymous",
      })),
    });
  } catch (error: any) {
    console.error("Error fetching received gifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch received gifts",
      error: error.message,
    });
  }
};

export const claimGift = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { giftId } = req.params;

    const gift = await prisma.goldGift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      res.status(404).json({
        success: false,
        message: "Gift not found",
      });
      return;
    }

    if (gift.status !== "PENDING") {
      res.status(400).json({
        success: false,
        message: `Gift has already been ${gift.status.toLowerCase()}`,
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    const userPhone = user?.phone?.replace(/[\s\-\+]/g, "").slice(-10);
    const giftPhone = gift.recipientPhone.replace(/[\s\-\+]/g, "").slice(-10);

    if (userPhone !== giftPhone) {
      res.status(403).json({
        success: false,
        message: "This gift was not sent to your phone number",
      });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      if (gift.giftType === "coins" && gift.coinGrams && gift.coinQuantity) {
        await tx.coinInventory.upsert({
          where: {
            userId_coinGrams: {
              userId,
              coinGrams: gift.coinGrams,
            },
          },
          update: {
            quantity: {
              increment: gift.coinQuantity,
            },
          },
          create: {
            userId,
            coinGrams: gift.coinGrams,
            quantity: gift.coinQuantity,
          },
        });

        await tx.coinTransaction.create({
          data: {
            userId,
            coinGrams: gift.coinGrams,
            quantity: gift.coinQuantity,
            type: "GIFT_RECEIVED",
            goldValue: 0,
            ratePerGram: 0,
            gst: 0,
            finalAmount: 0,
            paymentMode: "GIFT",
          },
        });
      } else {
        await tx.wallet.upsert({
          where: { userId },
          update: {
            goldBalance: {
              increment: gift.goldGrams,
            },
          },
          create: {
            userId,
            goldBalance: gift.goldGrams,
            rupeeBalance: 0,
          },
        });

        await tx.goldTransaction.create({
          data: {
            userId,
            type: "BUY",
            goldGrams: gift.goldGrams,
            ratePerGram: parseFloat(String(gift.amount)) / gift.goldGrams,
            totalAmount: parseFloat(String(gift.amount)),
            gst: 0,
            finalAmount: parseFloat(String(gift.amount)),
            paymentMode: "GIFT",
            status: "COMPLETED",
            storageType: "vault",
          },
        });
      }

      const updatedGift = await tx.goldGift.update({
        where: { id: giftId },
        data: {
          status: "CLAIMED",
          claimedAt: new Date(),
          recipientId: userId,
        },
      });

      return updatedGift;
    });

    res.json({
      success: true,
      message:
        gift.giftType === "coins"
          ? `${gift.coinQuantity}x ${gift.coinGrams}g coins added to your inventory!`
          : `${gift.goldGrams.toFixed(4)}g gold added to your wallet!`,
      data: result,
    });
  } catch (error: any) {
    console.error("Error claiming gift:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim gift",
      error: error.message,
    });
  }
};
