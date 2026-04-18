import { Router } from "express";

import * as partnerController from "../controllers/partner.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

export const router = Router();

router.get("/", partnerController.getPartnersByLocation);

router.post("/register",
    authMiddleware,
    roleMiddleware("ADMIN"),
    partnerController.registerPartner
);

router.post("/details", authMiddleware, partnerController.addParterDetails);