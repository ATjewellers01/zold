import prisma from "../config/db.js";

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
    userId,
    purchasedGrams,
    purchasedAmount
) => {
    const hasActiveGoals = await prisma.metalGoal.findMany({
        where: {
            userId,
            status: "ACTIVE"
        },
        orderBy: {
            createdAt: "asc"
        }
    });

    if (!hasActiveGoals.length) {
        return null;
    }

    let spillAmount = purchasedAmount;
    let spillGrams = purchasedGrams;
    for(const goal of hasActiveGoals) {
        if (Number(goal.targetAmount) > 0 && Number(goal.targetGrams) === 0) {
            if (goal.currentAmount.add(spillAmount).greaterThanOrEqualTo(goal.targetAmount)) {
                const amountNeeded = goal.targetAmount.sub(goal.currentAmount);
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: {
                        currentAmount: goal.targetAmount,
                        status: "COMPLETED",
                        completionDate: new Date()
                    }
                });
                spillAmount = spillAmount.sub(amountNeeded);
            } else {
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: { currentAmount: { increment: spillAmount } }
                });
                break;
            }
        } else if (Number(goal.targetGrams) > 0 && Number(goal.targetAmount) === 0) {
            if (goal.currentGrams.add(spillGrams).greaterThanOrEqualTo(goal.targetGrams)) {
                const gramsNeeded = goal.targetGrams.sub(goal.currentGrams);
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: {
                        currentGrams: goal.targetGrams,
                        status: "COMPLETED",
                        completionDate: new Date()
                    }
                });
                spillGrams = spillGrams.sub(gramsNeeded);
            } else {
                await prisma.metalGoal.updateMany({
                    where: { id: goal.id },
                    data: { currentGrams: { increment: spillGrams } }
                });
                break;
            }
        }
    }
    
}