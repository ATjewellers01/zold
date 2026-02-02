const { PrismaClient } = require('../generated/prisma');

const prisma = new PrismaClient();

// Get all users
const getAllUsers = async (req, res) => {
  console.log("Executing getAllUsers with Prisma");
  try {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        kyc: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Transform data for admin view
    const enrichedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
      riskLevel: user.riskLevel,
      isVerified: user.isVerified,
      goldBalance: user.wallet?.goldBalance || 0,
      rupeeBalance: user.wallet?.rupeeBalance || 0,
      kycStatus: user.kyc?.status || 'PENDING',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    res.status(200).json({ success: true, data: enrichedUsers });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

// Create user
const createUser = async (req, res) => {
  try {
    const { name, email, password, username } = req.body;
    
    // Note: Password hashing should be done here if not handled elsewhere
    // For now assuming basic creation as per original controller intent
    
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password, // Warning: Should be hashed
        username: username || email.split('@')[0], // Fallback username
        role: 'USER',
        isVerified: true // Assumption for immediate creation
      }
    });
    
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, message: 'Error creating user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, isVerified } = req.body;
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        isVerified
      }
    });
    
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === 'P2025') {
       return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.user.delete({
      where: { id }
    });
    
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    if (error.code === 'P2025') {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
