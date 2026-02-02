const { PrismaClient } = require('../generated/prisma');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

/**
 * Get complete user profile with all related data
 */
const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { userId },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
      wallet: {
        select: {
          goldBalance: true,
          rupeeBalance: true
        }
      },
      kyc: {
        select: {
          status: true,
          panNumber: true,
          aadhaarNumber: true,
          verifiedAt: true
        }
      }
    }
  });

  return user;
};

/**
 * Update user profile information
 */
const updateUserProfile = async (userId, data) => {
  const { name, phone, email } = data;

  // Check if email is being changed and if it's already taken
  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser && existingUser.id !== userId) {
      throw new Error('Email already in use');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email })
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true
    }
  });

  return updatedUser;
};

/**
 * Change user password
 */
const changePassword = async (userId, oldPassword, newPassword) => {
  // Get current password
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Verify old password
  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword }
  });

  return { message: 'Password changed successfully' };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword
};
