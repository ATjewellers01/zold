import prisma from "../config/db.js"
import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js";

export const getUserByPhone = async (recipientPhoneNumber: string) => {
  const user = await prisma.user.findUnique({
    where: { phone: recipientPhoneNumber },
    select: {
      id: true,
      name: true,
      email: true,
      profilePicture: true,
    },
  });

  if (!user) {
    throw new Error("User does not exists");
  }

  return user;
};

export const sendGiftToRecipient = async (userId: string, recipientId: string, giftDetails: any) => {
  const { giftType, occasion, metalType, metalGrams, coinGrams, message, coinQuantity } = giftDetails;

  if (!metalType || !giftType || (!metalGrams && !coinGrams)) {
    throw new Error("Gift type required");
  }

  if (Number(metalGrams) > 0 && !coinGrams) {
    const rate = metalType === "GOLD" ? await getCurrentGoldRate() : await getCurrentSilverRate();
    const ratePerGram = rate.buyRate;
    const gramsNum = parseFloat(String(metalGrams));
    const totalAmount = gramsNum * ratePerGram;

    return await prisma.$transaction(async (tx) => {
      const [senderWallet, sender] = await Promise.all([
        tx.wallet.findUnique({ where: { userId } }),
        tx.user.findUnique({ where: { id: userId }, select: { name: true } }),
      ]);

      if (!senderWallet) throw new Error("Sender wallet not found");

      const senderBalance = metalType === "GOLD"
        ? parseFloat(String(senderWallet.goldBalance))
        : parseFloat(String(senderWallet.silverBalance));

      if (senderBalance < gramsNum) throw new Error("Not enough balance");

      await tx.wallet.upsert({
        where: { userId: recipientId },
        update: metalType === "GOLD"
          ? { goldBalance: { increment: metalGrams } }
          : { silverBalance: { increment: metalGrams } },
        create: {
          userId: recipientId,
          goldBalance: metalType === "GOLD" ? metalGrams : 0,
          silverBalance: metalType === "SILVER" ? metalGrams : 0,
        }
      });

      await tx.wallet.update({
        where: { userId },
        data: metalType === "GOLD"
          ? { goldBalance: { decrement: metalGrams } }
          : { silverBalance: { decrement: metalGrams } }
      });

      const gift = await tx.metalGift.create({
        data: {
          senderId: userId,
          recipientId,
          giftType,
          metalType,
          metalGrams,
          coinQuantity: null,
          coinGrams: null,
          message,
          occasion,
          status: "COMPLETED"
        }
      });

      await tx.metalTransaction.create({
        data: {
          user_id: userId,
          metalGiftId: gift.id,
          metalType,
          transactionType: "GIFT",
          metalGrams,
          ratePerGram,
          totalAmount,
          gst: 0,
          gstRate: 0,
          finalAmount: totalAmount,
          paymentMode: "WALLET",
          status: "COMPLETED",
        }
      });

      const metalLabel = metalType === "GOLD" ? "Gold" : "Silver";
      const notification = await tx.notification.create({
        data: {
          user_id: recipientId,
          type: "GIFT_RECEIVED",
          title: `You received a ${metalLabel} gift!`,
          body: `${sender?.name ?? "Someone"} sent you ${gramsNum}g of ${metalLabel}.`,
          data: { giftId: gift.id, senderName: sender?.name, metalType, metalGrams: gramsNum, message: message ?? null },
        }
      });

      return { gift, notification };
    });
  }
  else if (Number(coinGrams) > 0) {
    return await prisma.$transaction(async (tx) => {
      const [senderInventory, sender] = await Promise.all([
        tx.coinInventory.findFirst({ where: { userId, coinGrams, metal: metalType } }),
        tx.user.findUnique({ where: { id: userId }, select: { name: true } }),
      ]);

      if (!senderInventory || senderInventory.quantity < coinQuantity) {
        throw new Error("Not enough coins");
      }

      await tx.coinInventory.upsert({
        where: {
          userId_coinGrams_metal: { userId: recipientId, coinGrams, metal: metalType }
        },
        update: { quantity: { increment: coinQuantity } },
        create: { userId: recipientId, metal: metalType, coinGrams, quantity: coinQuantity }
      });

      await tx.coinInventory.update({
        where: {
          userId_coinGrams_metal: { userId, coinGrams, metal: metalType }
        },
        data: { quantity: { decrement: coinQuantity } }
      });

      const gift = await tx.metalGift.create({
        data: {
          senderId: userId,
          recipientId,
          giftType,
          metalType,
          metalGrams: null,
          coinQuantity,
          coinGrams,
          message,
          occasion,
          status: "COMPLETED"
        }
      });

      const metalLabel = metalType === "GOLD" ? "Gold" : "Silver";
      const notification = await tx.notification.create({
        data: {
          user_id: recipientId,
          type: "GIFT_RECEIVED",
          title: `You received a ${metalLabel} coin gift!`,
          body: `${sender?.name ?? "Someone"} sent you ${coinQuantity}x ${coinGrams}g ${metalLabel} coin(s).`,
          data: { giftId: gift.id, senderName: sender?.name, metalType, coinGrams, coinQuantity, message: message ?? null },
        }
      });

      return { gift, notification };
    });
  }
};