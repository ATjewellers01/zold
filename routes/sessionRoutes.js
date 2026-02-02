const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All session routes require authentication
router.get('/', authMiddleware, sessionController.getUserSessions);
router.delete('/:id', authMiddleware, sessionController.revokeSession);
router.post('/revoke-all', authMiddleware, sessionController.revokeAllSessions);
router.get('/security-settings', authMiddleware, sessionController.getSecuritySettings);
router.put('/security-settings', authMiddleware, sessionController.updateSecuritySettings);

module.exports = router;
