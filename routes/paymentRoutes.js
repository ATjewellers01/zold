const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// All payment method routes require authentication
router.get('/', authMiddleware, paymentController.getPaymentMethods);
router.post('/', authMiddleware, paymentController.addPaymentMethod);
router.put('/:id', authMiddleware, paymentController.updatePaymentMethod);
router.delete('/:id', authMiddleware, paymentController.deletePaymentMethod);
router.put('/:id/set-primary', authMiddleware, paymentController.setPrimaryMethod);

module.exports = router;
