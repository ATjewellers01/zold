import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { getNotifications, markAllRead, markOneRead, clearAll } from "../controllers/notification.controller.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read", markAllRead);
router.patch("/:id/read", markOneRead);
router.delete("/", clearAll);

export default router;
