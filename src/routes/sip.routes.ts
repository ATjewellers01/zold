import { Router } from "express";

import * as sipController from "../controllers/sip.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

export const router = Router();

router.get("/all", authMiddleware, sipController.getSip);
router.post("/create",
    authMiddleware,
    roleMiddleware("ADMIN"),
    sipController.createSip
);
router.get("/my-sips", authMiddleware, sipController.activeSip);
router.post("/order", authMiddleware, sipController.createSipOrder);
router.post("/verify", authMiddleware, sipController.verifySip);
router.post("/topup/order", authMiddleware, sipController.createTopupOrder);
router.post("/topup/verify", authMiddleware, sipController.verifyTopup);
router.patch("/modify", authMiddleware, sipController.modifySip);