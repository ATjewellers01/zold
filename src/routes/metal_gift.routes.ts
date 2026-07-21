import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { lookupUserByPhone, sendGift } from "../controllers/metal_gift.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/lookup", lookupUserByPhone);
router.post("/send", sendGift);

export default router;