const bankService = require('../services/bankService');

/**
 * Get all bank accounts for user
 */
const getBankAccounts = async (req, res) => {
  try {
    const userId = req.user.id;
    const accounts = await bankService.getUserBankAccounts(userId);
    
    res.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('Error getting bank accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bank accounts',
      error: error.message
    });
  }
};

/**
 * Add new bank account
 */
const addBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const account = await bankService.addBankAccount(userId, req.body);
    
    res.json({
      success: true,
      message: 'Bank account added successfully',
      data: account
    });
  } catch (error) {
    console.error('Error adding bank account:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add bank account',
      error: error.message
    });
  }
};

/**
 * Update bank account
 */
const updateBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updated = await bankService.updateBankAccount(id, userId, req.body);
    
    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Error updating bank account:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update bank account',
      error: error.message
    });
  }
};

/**
 * Delete bank account
 */
const deleteBankAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await bankService.deleteBankAccount(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to delete bank account',
      error: error.message
    });
  }
};

/**
 * Set primary bank account
 */
const setPrimaryAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await bankService.setPrimaryBankAccount(id, userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error setting primary account:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to set primary account',
      error: error.message
    });
  }
};

module.exports = {
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setPrimaryAccount
};
