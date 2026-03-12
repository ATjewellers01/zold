import { Router, Request, Response } from "express";

// Import route modules
import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import goldRoutes from "./goldRoutes.js";
import profileRoutes from "./profileRoutes.js";
import bankRoutes from "./bankRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import sessionRoutes from "./sessionRoutes.js";
import partnerRoutes from "./partnerRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import goldGoalRoutes from "./goldGoalRoutes.js";
import goldGiftRoutes from "./goldGiftRoutes.js";
import referralRoutes from "./referralRoutes.js";
import coinRoutes from "./coinRoutes.js";
import paymentMethodRoutes from "./paymentMethodRoutes.js";

const router = Router();

// Use route modules
router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/gold", goldRoutes);
router.use("/profile", profileRoutes);
router.use("/bank-accounts", bankRoutes);
router.use("/payment-methods", paymentRoutes);
router.use("/sessions", sessionRoutes);
router.use("/partners", partnerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/gold-goals", goldGoalRoutes);
router.use("/gold-gifts", goldGiftRoutes);
router.use("/referrals", referralRoutes);
router.use("/coins", coinRoutes);
router.use("/payment-methods-v2", paymentMethodRoutes);

// Default route
router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Zold API" });
});

export default router;
