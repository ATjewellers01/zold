import { Router } from "express";
import * as goldGoalController from "../controllers/metal_goal.controller.js";

import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.post("/", goldGoalController.createGoal);
router.get("/", goldGoalController.getGoals);
router.get("/history", goldGoalController.getGoalHistory);
router.patch("/:id", goldGoalController.updateGoal);
router.delete("/:id", goldGoalController.deleteGoal);

export default router;
