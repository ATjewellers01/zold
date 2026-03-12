import { Router } from "express";
import * as authController from "../controllers/authController.js";

const router = Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/verify-otp", authController.verifyOtp);

router.get("/approve-admin/:token", authController.approveAdmin);

export default router;
