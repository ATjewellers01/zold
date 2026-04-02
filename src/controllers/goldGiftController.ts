import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import { getUserByPhone, sendGiftToRecipient } from "../services/metalGiftService.js";

export const lookupUserByPhone = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { phone } = req.query;

    if (!phone) {
      res.status(400).json({ success: false, message: "Phone number is required" });
      return;
    }

    const user = await getUserByPhone(phone as string);
    res.json({
      success: true,
      found: true,
      data: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error: any) {
    if (error.message === "User does not exists") {
      res.json({ success: true, found: false, message: "No ZOLD user found with this number" });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

export const sendGift = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      recipientId,
      metalType,
      giftType,
      metalGrams,
      coinGrams,
      coinQuantity,
      message,
      occasion,
    } = req.body;

    if (!recipientId) {
      res.status(400).json({ success: false, message: "Recipient not found. Please look up by phone first." });
      return;
    }

    const giftDetails = {
      metalType,
      giftType,
      metalGrams: metalGrams ?? null,
      coinGrams: coinGrams ?? null,
      coinQuantity: coinQuantity ?? null,
      message,
      occasion,
    };

    const result = await sendGiftToRecipient(userId, recipientId, giftDetails);

    const io = req.app.get("io");
    if (io && result?.notification) {
      const n = result.notification;
      io.to(recipientId).emit("notification", {
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        data: n.data,
        is_read: n.is_read,
        created_at: n.created_at,
      });
    }

    res.json({ success: true, message: "Gift sent successfully!" });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
