import { Router } from "express";
import * as partnerController from "../controllers/partnerController";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// Get all partners - accessible to all authenticated users
router.get("/", authMiddleware, partnerController.getAllPartners);

// Search partners - accessible to all authenticated users
router.get("/search", authMiddleware, partnerController.searchPartners);

// Get partner by ID - accessible to all authenticated users
router.get("/:id", authMiddleware, partnerController.getPartnerById);

// Create partner with user account - ADMIN only
router.post(
  "/create-account",
  authMiddleware,
  roleMiddleware("ADMIN"),
  partnerController.createPartnerAccount,
);

// Create new partner (basic, no account) - ADMIN only
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  partnerController.createPartner,
);

// Update partner - ADMIN only
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  partnerController.updatePartner,
);

// Delete partner - ADMIN only
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  partnerController.deletePartner,
);

export default router;
