const express = require('express');
const router = express.Router();
const referralController = require('../controllers/referralController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All routes are protected
router.use(authMiddleware);

router.get('/stats', referralController.getReferralStats);

module.exports = router;
