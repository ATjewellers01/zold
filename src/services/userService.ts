import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import { supabase } from "../config/supabase.js";

interface UserData {
  name: string;
  email: string;
  phone?: string;
  username?: string;
  password?: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  profilePicture: string | null;
}

export const getAllUsers = async (): Promise<UserResponse[]> => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profilePicture: true,
      role: true,
      isVerified: true,
      phone: true,
      wallet: {
        select: {
          goldBalance: true,
          silverBalance: true,
        }
      }
    },
  });

  return users;
};

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

export const createUser = async (userData: UserData) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new Error("Email already in use");
  }

  const hashedPassword = userData.password
    ? await bcrypt.hash(userData.password, 10)
    : "";

  const newUser = await prisma.user.create({
    data: {
      name: userData.name,
      email: userData.email,
      phone: userData.phone ?? userData.email,
      username: userData.username || userData.email,
      password: hashedPassword,
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

export const uploadProfilePictureService = async (id: string, file) => {
  const filePath = `profile-picture/${id}/${Date.now()}-${file.originalname}`;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if(user?.profilePicture) {
    const { error } = await supabase.storage.from("Profile Images").remove([user?.profilePicture]);
    if(error) {
      console.warn("Deletion failed", error?.message);
    }
  }

  const { data, error } = await supabase.storage.from("Profile Images")
  .upload(filePath, file.buffer, {
    contentType: file.mimetype
  });

  if(error) {
    throw error;
  }

  const { data: urlData } = await supabase.storage.from("Profile Images")
  .getPublicUrl(filePath);

  try {
    await prisma.user.update({
      where: { id },
      data: { profilePicture: urlData.publicUrl }
    });
  }
  catch(error) {
    await supabase.storage.from("Profile Images").remove([filePath]);
    throw error;
  }
};