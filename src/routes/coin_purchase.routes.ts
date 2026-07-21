import { Router } from "express";
import {
    addCartItem,
    removeCartItem,
    cancelCoinPurchaseSession,
    createCoinRazorpayOrder,
    failedCoinRazorPayment,
    getActiveCoinSession,
    getCart,
    initiateCoinPurchaseSession,
    verifyCoinRazorPayment
} from "../controllers/coin_purchase.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/active", authMiddleware, getActiveCoinSession);
router.get("/cart", authMiddleware, getCart);
router.post("/cart/item", authMiddleware, addCartItem);
router.delete("/cart/item", authMiddleware, removeCartItem);
router.post("/checkout", authMiddleware, initiateCoinPurchaseSession);
router.post("/create-order", authMiddleware, createCoinRazorpayOrder);
router.post("/verify-payment", authMiddleware, verifyCoinRazorPayment);
router.post("/record-failure", authMiddleware, failedCoinRazorPayment);
router.post("/cancel", authMiddleware, cancelCoinPurchaseSession);

export default router;
