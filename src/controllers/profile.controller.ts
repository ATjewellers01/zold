import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import * as profileService from "../services/profile.service.js";

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const profile = await profileService.getUserProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("Error getting profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
      error: error.message,
    });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const updatedProfile = await profileService.updateUserProfile(
      userId,
      req.body,
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedProfile,
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to update profile",
      error: error.message,
    });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Old password and new password are required",
      });
      return;
    }

    const result = await profileService.changePassword(
      userId,
      oldPassword,
      newPassword,
    );

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error changing password:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to change password",
      error: error.message,
    });
  }
};
