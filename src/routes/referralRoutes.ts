import { Router } from "express";
import * as referralController from "../controllers/referralController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get("/stats", referralController.getReferralStats);

export default router;
