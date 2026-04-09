import { Router } from "express";
import {
    addToPrimaryCart,
    cancelCoinPurchaseSession,
    createCoinRazorpayOrder,
    failedCoinRazorPayment,
    initiateCoinPurchaseSession,
    verifyCoinRazorPayment
} from "../controllers/coinPurchaseSessionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/cart", authMiddleware, addToPrimaryCart);
router.post("/checkout/:cartId", authMiddleware, initiateCoinPurchaseSession);
router.post("/create-order", authMiddleware, createCoinRazorpayOrder);
router.post("/verify-payment", authMiddleware, verifyCoinRazorPayment);
router.post("/record-failure", authMiddleware, failedCoinRazorPayment);
router.post("/cancel", authMiddleware, cancelCoinPurchaseSession);

export default router;
