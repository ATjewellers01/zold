import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);

router.get("/approve-admin/:token", authController.approveAdmin);

export default router;
