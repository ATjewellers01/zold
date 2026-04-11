import { Router, Request, Response } from "express";

import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import walletRoutes from "./wallet.routes.js";
import ratesRoutes from "./metal_rate.routes.js";
import profileRoutes from "./profile.routes.js";
import goldGoalRoutes from "./metal_goal.routes.js";
import coinRoutes from "./coin.routes.js";
import coinPurchaseSessionRoute from "./coin_purchase_session.routes.js";
import metalPurchaseSessionRoutes from "./metal_purchase_session.routes.js";
import adminRoutes from "./admin.routes.js";
import metaRoutes from "./gst.routes.js";
import metalGiftRoutes from "./metal_gift.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/wallet", walletRoutes);
router.use("/rates", ratesRoutes);
router.use("/profile", profileRoutes);
router.use("/gold-goals", goldGoalRoutes);
router.use("/coins", coinRoutes);
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
