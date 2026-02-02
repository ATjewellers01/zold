const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All bank account routes require authentication
router.get('/', authMiddleware, bankController.getBankAccounts);
router.post('/', authMiddleware, bankController.addBankAccount);
router.put('/:id', authMiddleware, bankController.updateBankAccount);
router.delete('/:id', authMiddleware, bankController.deleteBankAccount);
router.put('/:id/set-primary', authMiddleware, bankController.setPrimaryAccount);

module.exports = router;
