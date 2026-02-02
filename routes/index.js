const express = require("express");
const router = express.Router();

// Import route modules
const userRoutes = require("./userRoutes");
const authRoutes = require("./authRoutes");
const goldRoutes = require("./goldRoutes");
const profileRoutes = require("./profileRoutes");
const bankRoutes = require("./bankRoutes");
const paymentRoutes = require("./paymentRoutes");
const sessionRoutes = require("./sessionRoutes");
const partnerRoutes = require("./partnerRoutes");
const dashboardRoutes = require("./dashboardRoutes");

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
router.use("/gold-goals", require("./goldGoalRoutes"));
router.use("/gold-gifts", require("./goldGiftRoutes"));
router.use("/referrals", require("./referralRoutes"));
router.use("/coins", require("./coinRoutes"));

// Default route
router.get("/", (req, res) => {
  res.json({ message: "Welcome to Zold API" });
});

module.exports = router;
