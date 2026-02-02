const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All profile routes require authentication
router.get('/', authMiddleware, profileController.getProfile);
router.put('/', authMiddleware, profileController.updateProfile);
router.put('/password', authMiddleware, profileController.changePassword);

module.exports = router;
