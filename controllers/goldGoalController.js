const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const goldService = require('../services/goldService');

/**
 * Create a new gold goal
 */
const createGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, targetAmount, deadline, category, icon, color, autoAllocate } = req.body;

    if (!name || !targetAmount || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Name, target amount, and deadline are required'
      });
    }

    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(currentRate.buyRate);
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
        icon: icon || '⭐',
        color: color || 'from-purple-500 to-pink-500',
        autoAllocate: autoAllocate || false,
        status: 'ACTIVE'
      }
    });

    res.json({
      success: true,
      data: goal,
      message: 'Gold goal created successfully'
    });
  } catch (error) {
    console.error('Error creating gold goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gold goal',
      error: error.message
    });
  }
};

/**
 * Get all goals for a user
 */
const getGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    const goals = await prisma.goldGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: goals
    });
  } catch (error) {
    console.error('Error fetching gold goals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gold goals',
      error: error.message
    });
  }
};

/**
 * Delete a goal
 */
const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const goal = await prisma.goldGoal.findUnique({
      where: { id }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    await prisma.goldGoal.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting gold goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gold goal',
      error: error.message
    });
  }
};

/**
 * Update a goal (e.g. add money/progress)
 */
const updateGoal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { currentAmount } = req.body;

    const goal = await prisma.goldGoal.findUnique({
      where: { id }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: 'Goal not found'
      });
    }

    if (goal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Recalculate grams based on current amount update
    // Note: Ideally we should track transaction history for goals too, 
    // but for now we just update the amount as per the UI logic.
    
    // We get currentRate to estimate grams, but since this is just "Adding Money" logic
    // we might want to use the rate at the time of addition.
    // For simplicity, we'll update the currentGrams based on current rate *for the added amount*?
    // Or just re-calculate total grams based on total amount / current rate? 
    // The UI does: currentGrams = newCurrentAmount / goldPrice.
    
    const currentRate = await goldService.getCurrentGoldRate();
    const goldPrice = parseFloat(currentRate.buyRate);
    const newCurrentGrams = parseFloat(currentAmount) / goldPrice;

    const updatedGoal = await prisma.goldGoal.update({
      where: { id },
      data: { 
        currentAmount: parseFloat(currentAmount),
        currentGrams: newCurrentGrams
      }
    });

    res.json({
      success: true,
      data: updatedGoal,
      message: 'Goal updated successfully'
    });
  } catch (error) {
    console.error('Error updating gold goal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gold goal',
      error: error.message
    });
  }
};

module.exports = {
  createGoal,
  getGoals,
  deleteGoal,
  updateGoal
};
