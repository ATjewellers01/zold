import prisma from "../config/db";

interface UserData {
  name: string;
  email: string;
  username?: string;
  password?: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

/**
 * Get all users with business logic
 */
export const getAllUsers = async (): Promise<UserResponse[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return users;
};

/**
 * Get user by ID
 */
export const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      phone: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/**
 * Create user with validation
 */
export const createUser = async (userData: UserData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      username: userData.username || userData.email,
      password: userData.password || "",
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return newUser;
};

/**
 * Update user
 */
export const updateUser = async (id: string, userData: Partial<UserData>) => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: userData,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });

  return updatedUser;
};

/**
 * Delete user
 */
export const deleteUser = async (id: string): Promise<{ message: string }> => {
  const existingUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new Error("User not found");
  }

  await prisma.user.delete({
    where: { id },
  });

  return { message: "User deleted successfully" };
};
