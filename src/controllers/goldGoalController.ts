import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/db";
import * as goldService from "../services/goldService";

export const createGoal = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      name,
      targetAmount,
      deadline,
      category,
      icon,
      color,
      autoAllocate,
    } = req.body;

    if (!name || !targetAmount || !deadline) {
      res.status(400).json({
        success: false,
        message: "Name, target amount, and deadline are required",
      });
      return;
    }

    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(String(currentRate.buyRate));
    const targetGrams = parseFloat(targetAmount) / goldPrice;

    const goal = await prisma.goldGoal.create({
      data: {
        userId,
        name,
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        targetGrams,
        currentGrams: 0,
        deadline: new Date(deadline),
        category,
        icon: icon || "⭐",
        color: color || "from-purple-500 to-pink-500",
        autoAllocate: autoAllocate || false,
        status: "ACTIVE",
      },
    });

    res.json({
      success: true,
      data: goal,
      message: "Gold goal created successfully",
    });
  } catch (error: any) {
    console.error("Error creating gold goal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create gold goal",
      error: error.message,
    });
  }
};

export const getGoals = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goals = await prisma.goldGoal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: goals,
    });
  } catch (error: any) {
    console.error("Error fetching gold goals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch gold goals",
      error: error.message,
    });
  }
};

export const deleteGoal = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const goal = await prisma.goldGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Goal not found",
      });
      return;
    }

    if (goal.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    await prisma.goldGoal.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting gold goal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete gold goal",
      error: error.message,
    });
  }
};

export const updateGoal = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { currentAmount } = req.body;

    const goal = await prisma.goldGoal.findUnique({
      where: { id },
    });

    if (!goal) {
      res.status(404).json({
        success: false,
        message: "Goal not found",
      });
      return;
    }

    if (goal.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(String(currentRate.buyRate));
    const newCurrentGrams = parseFloat(currentAmount) / goldPrice;

    const updatedGoal = await prisma.goldGoal.update({
      where: { id },
      data: {
        currentAmount: parseFloat(currentAmount),
        currentGrams: newCurrentGrams,
      },
    });

    res.json({
      success: true,
      data: updatedGoal,
      message: "Goal updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating gold goal:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update gold goal",
      error: error.message,
    });
  }
};
