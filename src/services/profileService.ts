import prisma from "../config/db.js";
import bcrypt from "bcryptjs";

interface UpdateProfileData {
  name?: string;
  phone?: string;
  email?: string;
}

interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  role: string;
  isVerified: boolean;
  createdAt: Date;
  wallet: { goldBalance: number; rupeeBalance: number } | null;
  kyc: {
    status: string;
    panNumber: string | null;
    aadhaarNumber: string | null;
    verifiedAt: Date | null;
  } | null;
}

/**
 * Get complete user profile with all related data
 */
export const getUserProfile = async (
  userId: string,
): Promise<UserProfile | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
          rupeeBalance: true,
        },
      },
      kyc: {
        select: {
          status: true,
          panNumber: true,
          aadhaarNumber: true,
          verifiedAt: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    ...user,
    wallet: user.wallet
      ? {
          goldBalance: parseFloat(String(user.wallet.goldBalance)),
          rupeeBalance: parseFloat(String(user.wallet.rupeeBalance)),
        }
      : null,
    kyc: user.kyc
      ? {
          status: user.kyc.status,
          panNumber: user.kyc.panNumber,
          aadhaarNumber: user.kyc.aadhaarNumber,
          verifiedAt: user.kyc.verifiedAt,
        }
      : null,
  };
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (
  userId: string,
  data: UpdateProfileData,
) => {
  const { name, phone, email } = data;

  if (email) {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(name && { name }),
      ...(phone && { phone }),
      ...(email && { email }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      username: true,
    },
  });

  return updatedUser;
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<{ message: string }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { password: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isValidPassword = await bcrypt.compare(oldPassword, user.password);
  if (!isValidPassword) {
    throw new Error("Current password is incorrect");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};
