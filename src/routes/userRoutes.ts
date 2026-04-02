import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware.js";
import multer from "multer";

const router = Router();

// User routes - All require authentication and ADMIN role
router.get(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getAllUsers,
);
router.get(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.getUserById,
);
router.post(
  "/",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.createUser,
);
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.updateUser,
);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("ADMIN"),
  userController.deleteUser,
);

import { upload } from "../middlewares/uploadMiddleware.js";

router.post("/upload", authMiddleware, upload.single("updated_image"), userController.uploadProfilePicture);

export default router;
