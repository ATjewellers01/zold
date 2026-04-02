import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import prisma from "../config/db.js";

export const getNotifications = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const notifications = await prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.is_read).length;
    res.json({ success: true, data: { notifications, unreadCount } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await prisma.notification.updateMany({
      where: { user_id: userId, is_read: false },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markOneRead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, user_id: userId },
      data: { is_read: true },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const clearAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await prisma.notification.deleteMany({ where: { user_id: userId } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
