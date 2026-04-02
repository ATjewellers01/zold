import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { getNotifications, markAllRead, markOneRead, clearAll } from "../controllers/notificationController.js";

const router = Router();

router.use(authMiddleware);

router.get("/", getNotifications);
router.patch("/read", markAllRead);
router.patch("/:id/read", markOneRead);
router.delete("/", clearAll);

export default router;
