import { Router } from "express";
import * as profileController from "../controllers/profile.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// All profile routes require authentication
router.get("/", authMiddleware, profileController.getProfile);
router.put("/", authMiddleware, profileController.updateProfile);
router.put("/password", authMiddleware, profileController.changePassword);

export default router;
