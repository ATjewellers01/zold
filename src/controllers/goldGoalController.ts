import { createGoalService, getGoalsService, getGoalHistoryService } from "../services/goldGoalService.js"

export const createGoal = async (req, res) => {
  try {
    const result = await createGoalService(req.user.id, req.body);
    return res.status(201).json({ success: true, message: "Goal created successfully", data: result });
  } catch(error) {
    return res.status(500).json({ success: false, message: (error as any).message || "Server error" });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await getGoalsService(req.user.id);
    return res.status(200).json({ success: true, data: goals });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as any).message || "Server error" });
  }
};

export const getGoalHistory = async (req, res) => {
  try {
    const history = await getGoalHistoryService(req.user.id);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    return res.status(500).json({ success: false, message: (error as any).message || "Server error" });
  }
};