// User service - Business logic layer
// Separates business logic from controllers

const User = require('../models/userModel');

class UserService {
  // Get all users with business logic
  static async getAllUsers() {
    const users = await User.findAll();
    // Add any business logic here (e.g., filtering sensitive data)
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at
    }));
  }

  // Get user by ID
  static async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Create user with validation
  static async createUser(userData) {
    // Check if email already exists
    const existingUser = await User.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already in use');
    }
    
    // Add password hashing here if needed
    const newUser = await User.create(userData);
    return newUser;
  }

  // Update user
  static async updateUser(id, userData) {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    const updatedUser = await User.update(id, userData);
    return updatedUser;
  }

  // Delete user
  static async deleteUser(id) {
    const existingUser = await User.findById(id);
    if (!existingUser) {
      throw new Error('User not found');
    }
    
    await User.delete(id);
    return { message: 'User deleted successfully' };
  }
}

module.exports = UserService;
