import { Router, Request, Response } from "express";

import userRoutes from "./userRoutes.js";
import authRoutes from "./authRoutes.js";
import walletRoutes from "./walletRoutes.js";
import ratesRoutes from "./metalRatesRoutes.js";
import profileRoutes from "./profileRoutes.js";
import sessionRoutes from "./sessionRoutes.js";
import partnerRoutes from "./partnerRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import goldGoalRoutes from "./goldGoalRoutes.js";
import referralRoutes from "./referralRoutes.js";
import coinRoutes from "./coinRoutes.js";
import paymentMethodRoutes from "./paymentMethodRoutes.js";
import coinPurchaseSessionRoute from "./coinPurchaseRoute.js";
import metalPurchaseSessionRoutes from "./metalPurchaseRoutes.js";
import adminRoutes from "./adminRoutes.js";
import metaRoutes from "./metalGstRoutes.js";
import metalGiftRoutes from "./metalGiftRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/rates", ratesRoutes);
router.use("/profile", profileRoutes);
router.use("/sessions", sessionRoutes);
router.use("/partners", partnerRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/gold-goals", goldGoalRoutes);
router.use("/referrals", referralRoutes);
router.use("/coins", coinRoutes);
router.use("/payment-methods", paymentMethodRoutes);
router.use("/coin-purchase-session", coinPurchaseSessionRoute);
router.use("/metal-purchase-session", metalPurchaseSessionRoutes);
router.use("/admin", adminRoutes);
router.use("/meta", metaRoutes);
router.use("/metal-gifts", metalGiftRoutes);
router.use("/notifications", notificationRoutes);

router.get("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to Zold API" });
});

export default router;
