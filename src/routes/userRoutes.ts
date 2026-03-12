import { Router } from "express";
import * as userController from "../controllers/userController";
import { authMiddleware, roleMiddleware } from "../middlewares/authMiddleware";

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

export default router;
