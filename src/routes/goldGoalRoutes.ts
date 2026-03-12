import { Router } from "express";
import * as goldGoalController from "../controllers/goldGoalController";
import { authMiddleware } from "../middlewares/authMiddleware";

const router = Router();

// All routes are protected
router.use(authMiddleware);

router.post("/", goldGoalController.createGoal);
router.get("/", goldGoalController.getGoals);
router.delete("/:id", goldGoalController.deleteGoal);
router.patch("/:id", goldGoalController.updateGoal);

export default router;
