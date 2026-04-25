import { Router } from "express";

import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";
import * as deliveryController from "../controllers/delivery.controller.js";

export const router = Router();

router.get("/delivery", authMiddleware, deliveryController.trackDelivery);
router.get("/delivery/assigned",
    authMiddleware, 
    roleMiddleware("PARTNER"), 
    deliveryController.trackPartnerAssignedDelivery
);

router.patch("/delivery/assigned/:deliveryId",
    authMiddleware,
    roleMiddleware("PARTNER"),
    deliveryController.updatePartnerDeliveryInformation
);

router.post("/delivery/:deliveryId", authMiddleware, deliveryController.cancelDelivery);
router.post("/delivery", authMiddleware, deliveryController.initiateDelivery);