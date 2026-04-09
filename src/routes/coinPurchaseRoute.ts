import { Router } from "express";
import { addToPrimaryCart, executeCoinPurchaseSession, initiateCoinPurchaseSession } from "../controllers/coinPurchaseSessionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/cart", authMiddleware, addToPrimaryCart);
router.post("/checkout/:cartId", authMiddleware, initiateCoinPurchaseSession);
router.post("/execute", authMiddleware, executeCoinPurchaseSession);


export default router;