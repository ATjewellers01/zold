import { Response } from "express";
import { AuthenticatedRequest } from "../types";
import * as sessionService from "../services/sessionService";

export const getUserSessions = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const sessions = await sessionService.getUserSessions(userId);

    res.json({
      success: true,
      data: sessions,
    });
  } catch (error: any) {
    console.error("Error getting sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get sessions",
      error: error.message,
    });
  }
};

export const revokeSession = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const result = await sessionService.revokeSession(id, userId);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error revoking session:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to revoke session",
      error: error.message,
    });
  }
};

export const revokeAllSessions = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const currentToken = req.headers.authorization?.split(" ")[1] || "";
    const result = await sessionService.revokeAllSessions(userId, currentToken);

    res.json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error revoking all sessions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to revoke sessions",
      error: error.message,
    });
  }
};

export const getSecuritySettings = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settings = await sessionService.getUserSecuritySettings(userId);

    res.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("Error getting security settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get security settings",
      error: error.message,
    });
  }
};

export const updateSecuritySettings = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const settings = await sessionService.updateSecuritySettings(
      userId,
      req.body,
    );

    res.json({
      success: true,
      message: "Security settings updated successfully",
      data: settings,
    });
  } catch (error: any) {
    console.error("Error updating security settings:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update security settings",
      error: error.message,
    });
  }
};
