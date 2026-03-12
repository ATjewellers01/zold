import { Router, Request, Response } from "express";

// Import route modules
import userRoutes from "./userRoutes";
import authRoutes from "./authRoutes";
import goldRoutes from "./goldRoutes";
import profileRoutes from "./profileRoutes";
import bankRoutes from "./bankRoutes";
import paymentRoutes from "./paymentRoutes";
import sessionRoutes from "./sessionRoutes";
import partnerRoutes from "./partnerRoutes";
import dashboardRoutes from "./dashboardRoutes";
import goldGoalRoutes from "./goldGoalRoutes";
import goldGiftRoutes from "./goldGiftRoutes";
import referralRoutes from "./referralRoutes";
import coinRoutes from "./coinRoutes";
import paymentMethodRoutes from "./paymentMethodRoutes";

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
