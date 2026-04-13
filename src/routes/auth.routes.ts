import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { sendOTP } from "../services/email.service.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/resend-otp", authController.resendOtp);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.me);

router.get("/approve-admin/:token", authController.approveAdmin);

export default router;
