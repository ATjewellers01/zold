import prisma from "../config/db.js";
import { Metal } from "../../generated/prisma/index.js";

export const createGoalService = async (userId, goalDetails) => {
  const {
    goalName,
    metalType,
    goalCategory,
    targetAmount,
    targetGrams,
    paymentFrequency,
    targetDate,
    completionDate
  }  = goalDetails;

  const result = await prisma.metalGoal.create({
    data: {
      userId,
      metal: metalType,
      goalName,
      goalCategory,
      targetAmount: targetAmount ? targetAmount : 0,
      targetGrams: targetGrams ? targetGrams : 0,
      paymentFrequency,
      targetDate: new Date(targetDate)
    }
  });

  return result;
};

export const getGoalsService = async (userId: string) => {
  const goals = await prisma.metalGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return goals;
};

export const getGoalHistoryService = async (userId: string) => {
  const history = await prisma.metalGoal.findMany({
    where: {
      userId,
      status: { in: ["COMPLETED", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
  });
  return history;
};

export const allocateToGoals = async (
    userId: string,
    metal: Metal,
    purchasedGrams: number,
    purchasedAmount: number
) => {
    const activeGoals = await prisma.metalGoal.findMany({
        where: {
            userId,
            metal,
            status: "ACTIVE"
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    if (!activeGoals.length) {
        return null;
    }

    let spillAmount = purchasedAmount;
    let spillGrams = purchasedGrams;

    for (const goal of activeGoals) {
        if (Number(goal.targetAmount) > 0 && Number(goal.targetGrams) === 0) {
            if (goal.currentAmount.add(spillAmount).greaterThanOrEqualTo(goal.targetAmount)) {
                const amountNeeded = Number(goal.targetAmount.sub(goal.currentAmount));
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: {
                        currentAmount: goal.targetAmount,
                        status: "COMPLETED",
                        completionDate: new Date()
                    }
                });
                spillAmount = spillAmount - amountNeeded;
            } else {
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: { currentAmount: { increment: spillAmount } }
                });
                break;
            }
        } else if (Number(goal.targetGrams) > 0 && Number(goal.targetAmount) === 0) {
            if (goal.currentGrams.add(spillGrams).greaterThanOrEqualTo(goal.targetGrams)) {
                const gramsNeeded = Number(goal.targetGrams.sub(goal.currentGrams));
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: {
                        currentGrams: goal.targetGrams,
                        status: "COMPLETED",
                        completionDate: new Date()
                    }
                });
                spillGrams = spillGrams - gramsNeeded;
            } else {
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: { currentGrams: { increment: spillGrams } }
                });
                break;
            }
        }
    }
};

export const updateGoalService = async (userId: string, goalId: string, updates: {
    goalName?: string;
    goalCategory?: string;
    targetAmount?: number;
    targetGrams?: number;
    paymentFrequency?: string;
    targetDate?: string;
}) => {
    const goal = await prisma.metalGoal.findFirst({ where: { id: goalId, userId } });
    if (!goal) throw new Error("Goal not found");

    const data: any = {};
    if (updates.goalName)        data.goalName        = updates.goalName;
    if (updates.goalCategory)    data.goalCategory    = updates.goalCategory;
    if (updates.paymentFrequency) data.paymentFrequency = updates.paymentFrequency;
    if (updates.targetDate)      data.targetDate      = new Date(updates.targetDate);

    // Only update targetAmount/targetGrams if goal type matches
    if (Number(goal.targetAmount) > 0 && updates.targetAmount !== undefined) {
        if (updates.targetAmount <= 0) throw new Error("Target amount must be positive");
        if (updates.targetAmount < Number(goal.currentAmount)) throw new Error("Target amount cannot be less than current progress");
        data.targetAmount = updates.targetAmount;
        // If goal is completed and target increased, reactivate
        if (goal.status === "COMPLETED" && updates.targetAmount > Number(goal.currentAmount)) {
            data.status = "ACTIVE";
            data.completionDate = null;
        }
    }
    if (Number(goal.targetGrams) > 0 && updates.targetGrams !== undefined) {
        if (updates.targetGrams <= 0) throw new Error("Target grams must be positive");
        if (updates.targetGrams < Number(goal.currentGrams)) throw new Error("Target grams cannot be less than current progress");
        data.targetGrams = updates.targetGrams;
        if (goal.status === "COMPLETED" && updates.targetGrams > Number(goal.currentGrams)) {
            data.status = "ACTIVE";
            data.completionDate = null;
        }
    }

    return prisma.metalGoal.update({ where: { id: goalId }, data });
};

export const deleteGoalService = async (userId, goalId) => {
    await prisma.metalGoal.delete({
        where: { id: goalId, userId }
    });

    return true;
};