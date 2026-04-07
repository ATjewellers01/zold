import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { lookupUserByPhone, sendGift } from "../controllers/goldGiftController.js";

const router = Router();

router.use(authMiddleware);

router.get("/lookup", lookupUserByPhone);
router.post("/send", sendGift);

export default router;