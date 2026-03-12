import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import prisma from "../config/db";

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  console.log("Executing getAllUsers with Prisma");
  try {
    const users = await prisma.user.findMany({
      include: {
        wallet: true,
        kyc: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const enrichedUsers = users.map((user) => ({
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
      kycStatus: user.kyc?.status || "PENDING",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.status(200).json({ success: true, data: enrichedUsers });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    console.error("Error fetching user:", error);
    res.status(500).json({ success: false, message: "Error fetching user" });
  }
};

export const createUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, username } = req.body;

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password,
        username: username || email.split("@")[0],
        role: "USER",
        isVerified: true,
      },
    });

    res.status(201).json({ success: true, data: newUser });
  } catch (error: any) {
    console.error("Error creating user:", error);
    res.status(500).json({ success: false, message: "Error creating user" });
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, email, role, isVerified } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        role,
        isVerified,
      },
    });

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error: any) {
    console.error("Error updating user:", error);
    if (error.code === "P2025") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id },
    });

    res
      .status(200)
      .json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    if (error.code === "P2025") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};
