const paymentMethodService = require('../services/paymentMethodService');

/**
 * Get all payment methods for a user
 */
const getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const paymentMethods = await paymentMethodService.getPaymentMethods(userId);
    
    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.message
    });
  }
};

/**
 * Add a new bank account
 */
const addBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountHolderName, bankName, accountNumber, ifscCode, accountType, isPrimary } = req.body;
    
    if (!accountHolderName || !bankName || !accountNumber || !ifscCode) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    const bankAccount = await paymentMethodService.addBankAccount(userId, {
      accountHolderName,
      bankName,
      accountNumber,
      ifscCode,
      accountType,
      isPrimary
    });
    
    res.json({
      success: true,
      message: 'Bank account added successfully',
      data: bankAccount
    });
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add bank account',
      error: error.message
    });
  }
};

/**
 * Add a new UPI method
 */
const addUpiMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { upiId, isPrimary } = req.body;
    
    if (!upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required'
      });
    }
    
    const upiMethod = await paymentMethodService.addUpiMethod(userId, {
      upiId,
      isPrimary
    });
    
    res.json({
      success: true,
      message: 'UPI method added successfully',
      data: upiMethod
    });
  } catch (error) {
    console.error('Error adding UPI method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add UPI method',
      error: error.message
    });
  }
};

/**
 * Set a bank account as primary
 */
const setPrimaryBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    
    const bankAccount = await paymentMethodService.setPrimaryBankAccount(userId, accountId);
    
    res.json({
      success: true,
      message: 'Primary bank account updated',
      data: bankAccount
    });
  } catch (error) {
    console.error('Error setting primary bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary bank account',
      error: error.message
    });
  }
};

/**
 * Set a UPI method as primary
 */
const setPrimaryUpiMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;
    
    const upiMethod = await paymentMethodService.setPrimaryUpiMethod(userId, methodId);
    
    res.json({
      success: true,
      message: 'Primary UPI method updated',
      data: upiMethod
    });
  } catch (error) {
    console.error('Error setting primary UPI method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set primary UPI method',
      error: error.message
    });
  }
};

/**
 * Delete a bank account
 */
const deleteBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    
    await paymentMethodService.deleteBankAccount(userId, accountId);
    
    res.json({
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank account',
      error: error.message
    });
  }
};

/**
 * Delete a UPI method
 */
const deleteUpiMethod = async (req, res) => {
  try {
    const userId = req.user.id;
    const { methodId } = req.params;
    
    await paymentMethodService.deleteUpiMethod(userId, methodId);
    
    res.json({
      success: true,
      message: 'UPI method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting UPI method:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete UPI method',
      error: error.message
    });
  }
};

module.exports = {
  getPaymentMethods,
  addBankAccount,
  addUpiMethod,
  setPrimaryBankAccount,
  setPrimaryUpiMethod,
  deleteBankAccount,
  deleteUpiMethod
};
