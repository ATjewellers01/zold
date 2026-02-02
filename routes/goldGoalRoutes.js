const express = require('express');
const router = express.Router();
const goldGoalController = require('../controllers/goldGoalController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.post('/', goldGoalController.createGoal);
router.get('/', goldGoalController.getGoals);
router.delete('/:id', goldGoalController.deleteGoal);
router.patch('/:id', goldGoalController.updateGoal);

module.exports = router;
