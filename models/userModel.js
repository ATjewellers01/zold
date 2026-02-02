// User model - Define database schema and queries
// This file contains reusable database query functions for users

const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

class User {
  // Find all users
  static async findAll() {
    return await prisma.user.findMany({
      orderBy: { id: 'asc' }
    });
  }

  // Find user by ID
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id }
    });
  }

  // Find user by email
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  // Create new user
  static async create(userData) {
    const { name, email, password, username, role, isVerified } = userData;
    return await prisma.user.create({
      data: {
        name,
        email,
        password,
        username: username || email.split('@')[0], // Fallback
        role: role || 'USER',
        isVerified: isVerified || false
      }
    });
  }

  // Update user
  static async update(id, userData) {
    const { name, email, role, isVerified } = userData;
    return await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        isVerified
      }
    });
  }

  // Delete user
  static async delete(id) {
    return await prisma.user.delete({
      where: { id }
    });
  }
}

module.exports = User;
