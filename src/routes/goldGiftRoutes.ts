import { Router } from "express";
import * as goldGiftController from "../controllers/goldGiftController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All routes are protected
router.use(authMiddleware);

// Lookup user by phone number
router.get("/lookup", goldGiftController.lookupUserByPhone);

// Send a gift
router.post("/send", goldGiftController.sendGift);

// Get sent gifts (gifts you sent to others)
router.get("/sent", goldGiftController.getSentGifts);

// Get received gifts (pending gifts sent to you)
router.get("/received", goldGiftController.getReceivedGifts);

// Claim a gift
router.post("/claim/:giftId", goldGiftController.claimGift);

export default router;
