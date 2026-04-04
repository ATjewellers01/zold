import { Router } from "express";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware.js";
import * as gstController from "../controllers/gstController.js";
import * as transactionController from "../controllers/transactionController.js";
import * as manageMetalPrice from "../controllers/manageMetalPriceController.js";

const router = Router();

// All admin routes require auth + ADMIN role
router.use(authMiddleware, roleMiddleware("ADMIN"));

// Metal
router.post("/update-prices", manageMetalPrice.updateMetalPrice);

// GST
router.post("/gst", gstController.setGstRate as any);
router.get("/gst/history", gstController.getGstHistory as any);

// Transaction history (admin can pass ?userId= to view any user)
router.get("/transactions/history", transactionController.getUserTransactionsHistory);
router.get("/transactions/sell-history", transactionController.getUserSellTransactionHistory);

// Sell transaction approval
router.post("/transactions/approve/:transactionId", transactionController.approveSellTransaction);
router.post("/transactions/reject/:transactionId", transactionController.rejectSellTransaction);

export default router;
