import { createGoalService, getGoalsService, getGoalHistoryService, deleteGoalService, updateGoalService } from "../services/metal_goal.service.js"

export const createGoal = async (req, res) => {
  try {
    console.log(req.body);
    const result = await createGoalService(req.user.id, req.body);
    return res.status(201).json({
      success: true, 
      message: "Goal created successfully", 
      data: result });
  } 
  catch(error) {
    console.log(error);
    return res.status(500).json({
      success: false, 
      message: (error as any).message || "Server error" 
    });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await getGoalsService(req.user.id);
    return res.status(200).json({
      success: true, 
      data: goals 
    });
  } 
  catch (error) {
    return res.status(500).json({
      success: false, 
      message: (error as any).message || "Server error" 
    });
  }
};

export const getGoalHistory = async (req, res) => {
  try {
    const history = await getGoalHistoryService(req.user.id);
    return res.status(200).json({
      success: true, 
      data: history 
    });
  } 
  catch (error) {
    return res.status(500).json({
      success: false, 
      message: (error as any).message || "Server error" 
    });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const updated = await updateGoalService(req.user.id, req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Goal updated successfully", data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message || "Server error" });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    await deleteGoalService(req.user.id, req.params.id);
    return res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
      data: {}
    });
  }
  catch(error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};