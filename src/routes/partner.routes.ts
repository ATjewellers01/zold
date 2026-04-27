import { Router } from "express";

import * as partnerController from "../controllers/partner.controller.js";
import { authMiddleware, roleMiddleware } from "../middlewares/auth.middleware.js";

export const router = Router();

router.get("/", 
    authMiddleware, 
    roleMiddleware("ADMIN", "USER"),
    partnerController.getPartnersByLocation
);

router.get("/details",
    authMiddleware,
    roleMiddleware("PARTNER"),
    partnerController.getPartnerDetails
);

router.post("/register",
    authMiddleware,
    roleMiddleware("ADMIN"),
    partnerController.registerPartner
);

router.post("/details", 
    authMiddleware,
    roleMiddleware("PARTNER"),
    partnerController.addParterDetails
);