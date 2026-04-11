import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import {
  getAllUsers as getAllUsersService,
  getUserById as getUserByIdService,
  createUser as createUserService,
  updateUser as updateUserService,
  deleteUser as deleteUserService,
  uploadProfilePictureService,
} from "../services/user.service.js";

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const users = await getAllUsersService();
    res.status(200).json({ success: true, data: users });
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
    const user = await getUserByIdService(id);
    res.status(200).json({ success: true, data: user });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
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

    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: "name, email, and password are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
      return;
    }

    const newUser = await createUserService({ name, email, password, username });
    res.status(201).json({ success: true, data: newUser });
  } catch (error: any) {
    if (error.message === "Email already in use") {
      res.status(409).json({ success: false, message: error.message });
      return;
    }
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
    const { name, email } = req.body;

    const updatedUser = await updateUserService(id, { name, email });
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Error updating user" });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    await deleteUserService(id);
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    if (error.message === "User not found") {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    console.error("Error deleting user:", error);
    res.status(500).json({ success: false, message: "Error deleting user" });
  }
};

export const uploadProfilePicture = async (
  req,
  res,
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }
    const result = await uploadProfilePictureService(req.user!.id, req.file);
    res.status(200).json({ success: true, message: "Profile picture uploaded", data: result });
  } catch (error: any) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
