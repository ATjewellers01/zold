const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();
const goldService = require("../services/goldService");

/**
 * Send gold gift - supports rupees, grams, and coins gift types
 */
const sendGift = async (req, res) => {
  try {
    const senderId = req.user.id;
    const {
      recipientName,
      recipientPhone,
      amount,
      message,
      occasion,
      giftType = "rupees", // 'rupees', 'grams', 'coins'
      goldGrams: directGrams, // For grams type
      coinGrams, // Coin denomination: 1, 2, 5, 10
      coinQuantity, // Number of coins
    } = req.body;

    if (!recipientName || !recipientPhone || !occasion) {
      return res.status(400).json({
        success: false,
        message: "Recipient name, phone, and occasion are required",
      });
    }

    // Validate based on gift type
    if (giftType === "rupees" && !amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required for rupees gift type",
      });
    }

    if (giftType === "grams" && !directGrams) {
      return res.status(400).json({
        success: false,
        message: "Gold grams is required for grams gift type",
      });
    }

    if (giftType === "coins") {
      if (!coinGrams || !coinQuantity) {
        return res.status(400).json({
          success: false,
          message:
            "Coin denomination and quantity are required for coin gift type",
        });
      }
      if (![1, 2, 5, 10].includes(coinGrams)) {
        return res.status(400).json({
          success: false,
          message: "Invalid coin denomination. Must be 1, 2, 5, or 10 grams",
        });
      }
    }

    // Get current rate
    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(currentRate.buyRate);

    // Calculate gold grams and amount based on gift type
    let goldGrams, giftAmount;

    if (giftType === "rupees") {
      giftAmount = parseFloat(amount);
      goldGrams = giftAmount / goldPrice;
    } else if (giftType === "grams") {
      goldGrams = parseFloat(directGrams);
      giftAmount = goldGrams * goldPrice;
    } else if (giftType === "coins") {
      goldGrams = coinGrams * coinQuantity;
      giftAmount = goldGrams * goldPrice;
    }

    // Create Transaction based on gift type
    const result = await prisma.$transaction(async (tx) => {
      if (giftType === "coins") {
        // Check CoinInventory for sufficient coins
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

        // Deduct coins from CoinInventory
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
        // For rupees and grams, deduct from wallet gold balance
        const wallet = await tx.wallet.findUnique({
          where: { userId: senderId },
        });

        if (!wallet || parseFloat(wallet.goldBalance) < goldGrams) {
          throw new Error(
            `Insufficient gold balance. You need ${goldGrams.toFixed(3)}g but have ${wallet?.goldBalance || 0}g.`,
          );
        }

        // Deduct Gold from Sender
        await tx.wallet.update({
          where: { userId: senderId },
          data: {
            goldBalance: { decrement: goldGrams },
          },
        });
      }

      // Create Transaction Record for Sender
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

      // Create Gift Record
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
  } catch (error) {
    console.error("Error sending gold gift:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to send gold gift",
      error: error.message,
    });
  }
};

/**
 * Get sent gifts
 */
const getSentGifts = async (req, res) => {
  try {
    const userId = req.user.id;
    const gifts = await prisma.goldGift.findMany({
      where: { senderId: userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: gifts,
    });
  } catch (error) {
    console.error("Error fetching sent gifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sent gifts",
      error: error.message,
    });
  }
};

/**
 * Lookup user by phone number for gifting
 */
const lookupUserByPhone = async (req, res) => {
  try {
    const { phone } = req.query;

    if (!phone || phone.length < 10) {
      return res.status(400).json({
        success: false,
        message: "Valid phone number is required",
      });
    }

    // Clean phone number - remove +91, spaces, etc.
    const cleanPhone = phone.replace(/[\s\-\+]/g, "").slice(-10);

    // Search for user by phone
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
        // Don't expose sensitive data
      },
    });

    if (!user) {
      return res.json({
        success: true,
        found: false,
        message:
          "No ZOLD user found with this number. They will receive an invite to join.",
      });
    }

    res.json({
      success: true,
      found: true,
      data: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        // Mask email for privacy
        email: user.email
          ? user.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
          : null,
      },
    });
  } catch (error) {
    console.error("Error looking up user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to lookup user",
      error: error.message,
    });
  }
};

/**
 * Get received gifts (pending gifts for the logged-in user by phone)
 */
const getReceivedGifts = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's phone number
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    if (!user?.phone) {
      return res.status(400).json({
        success: false,
        message: "User phone number not found",
      });
    }

    // Clean phone to get last 10 digits
    const cleanPhone = user.phone.replace(/[\s\-\+]/g, "").slice(-10);

    // Find gifts sent to this phone number
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
  } catch (error) {
    console.error("Error fetching received gifts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch received gifts",
      error: error.message,
    });
  }
};

/**
 * Claim a gift - adds coins/gold to recipient's wallet
 */
const claimGift = async (req, res) => {
  try {
    const userId = req.user.id;
    const { giftId } = req.params;

    // Get the gift
    const gift = await prisma.goldGift.findUnique({
      where: { id: giftId },
    });

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: "Gift not found",
      });
    }

    if (gift.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Gift has already been ${gift.status.toLowerCase()}`,
      });
    }

    // Verify recipient by phone
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phone: true },
    });

    const userPhone = user?.phone?.replace(/[\s\-\+]/g, "").slice(-10);
    const giftPhone = gift.recipientPhone.replace(/[\s\-\+]/g, "").slice(-10);

    if (userPhone !== giftPhone) {
      return res.status(403).json({
        success: false,
        message: "This gift was not sent to your phone number",
      });
    }

    // Process claim based on gift type
    const result = await prisma.$transaction(async (tx) => {
      if (gift.giftType === "coins") {
        // Add coins to recipient's CoinInventory
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

        // Create coin transaction record
        await tx.coinTransaction.create({
          data: {
            userId,
            coinGrams: gift.coinGrams,
            quantity: gift.coinQuantity,
            type: "GIFT_RECEIVED",
            amountPaid: 0,
            ratePerGram: 0,
          },
        });
      } else {
        // Add gold to recipient's wallet (for rupees or grams)
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
            cashBalance: 0,
          },
        });

        // Create gold transaction record
        await tx.goldTransaction.create({
          data: {
            userId,
            type: "BUY",
            goldGrams: gift.goldGrams,
            pricePerGram: parseFloat(gift.amount) / gift.goldGrams,
            totalAmount: parseFloat(gift.amount),
            finalAmount: parseFloat(gift.amount),
            paymentMode: "GIFT",
            status: "COMPLETED",
            storageType: "vault",
          },
        });
      }

      // Update gift status
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
  } catch (error) {
    console.error("Error claiming gift:", error);
    res.status(500).json({
      success: false,
      message: "Failed to claim gift",
      error: error.message,
    });
  }
};

module.exports = {
  sendGift,
  getSentGifts,
  lookupUserByPhone,
  getReceivedGifts,
  claimGift,
};
