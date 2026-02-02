const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middlewares/authMiddleware');

// User routes - All require authentication and ADMIN role
router.get('/', authMiddleware, roleMiddleware('ADMIN'), userController.getAllUsers);
router.get('/:id', authMiddleware, roleMiddleware('ADMIN'), userController.getUserById);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), userController.createUser);
router.put('/:id', authMiddleware, roleMiddleware('ADMIN'), userController.updateUser);
router.delete('/:id', authMiddleware, roleMiddleware('ADMIN'), userController.deleteUser);

module.exports = router;
