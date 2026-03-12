import { Router } from "express";
import * as sessionController from "../controllers/sessionController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

// All session routes require authentication
router.get("/", authMiddleware, sessionController.getUserSessions);
router.delete("/:id", authMiddleware, sessionController.revokeSession);
router.post("/revoke-all", authMiddleware, sessionController.revokeAllSessions);
router.get(
  "/security-settings",
  authMiddleware,
  sessionController.getSecuritySettings,
);
router.put(
  "/security-settings",
  authMiddleware,
  sessionController.updateSecuritySettings,
);

export default router;
