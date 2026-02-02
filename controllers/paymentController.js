const paymentService = require('../services/paymentService');

/**
 * Get all payment methods for user
 */
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    const methods = await paymentService.getUserPaymentMethods(userId);
    
    res.json({
      success: true,
      data: methods
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

/**
 * Add new payment method
 */
const addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const method = await paymentService.addPaymentMethod(userId, req.body);
    
    res.json({
      success: true,
      message: 'Payment method added successfully',
      data: method
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add payment method',
      error: error.message
    });
  }
};

/**
 * Update payment method
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await paymentService.updatePaymentMethod(id, userId, req.body);
    
    res.json({
      success: true,
      message: 'Payment method updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update payment method',
      error: error.message
    });
  }
};

/**
 * Delete payment method
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await paymentService.deletePaymentMethod(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete payment method',
      error: error.message
    });
  }
};

/**
 * Set primary payment method
 */
const setPrimaryMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await paymentService.setPrimaryPaymentMethod(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error setting primary method:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set primary method',
      error: error.message
    });
  }
};

module.exports = {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  setPrimaryMethod
};
