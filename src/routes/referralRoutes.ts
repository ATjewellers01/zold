import { Router } from "express";
import * as referralController from "../controllers/referralController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.get("/stats", referralController.getReferralStats);

export default router;
