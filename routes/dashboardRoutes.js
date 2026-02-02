const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// All dashboard routes require admin authentication
router.get('/metrics', 
  authMiddleware, 
  roleMiddleware('ADMIN'), 
  dashboardController.getDashboardMetrics
);

router.get('/analytics/transactions', 
  authMiddleware, 
  roleMiddleware('ADMIN'), 
  dashboardController.getTransactionAnalytics
);

router.get('/analytics/users', 
  authMiddleware, 
  roleMiddleware('ADMIN'), 
  dashboardController.getUserGrowthAnalytics
);

module.exports = router;
