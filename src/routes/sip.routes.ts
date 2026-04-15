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