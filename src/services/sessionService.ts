import prisma from "../config/db";
import { UAParser } from "ua-parser-js";
import { UserSession } from "../../generated/prisma";

interface SecuritySettings {
  twoFactorEnabled: boolean;
  readReceipts: boolean;
  dataSharing: boolean;
  profileVisibility: string;
}

/**
 * Get all active sessions for a user
 */
export const getUserSessions = async (
  userId: string,
): Promise<UserSession[]> => {
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    orderBy: [{ isActive: "desc" }, { lastActivity: "desc" }],
  });

  return sessions;
};

/**
 * Create a new session when user logs in
 */
export const createSession = async (
  userId: string,
  token: string,
  userAgent: string,
  ipAddress: string,
): Promise<UserSession> => {
  try {
    const parser = new UAParser(userAgent);
    const result = parser.getResult();

    const deviceName = result.browser.name || "Unknown Browser";
    const deviceType = result.device.type || "desktop";
    const browser = result.browser.name || "Unknown";
    const os = result.os.name || "Unknown OS";

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.userSession.create({
      data: {
        userId,
        deviceName: `${deviceName} on ${os}`,
        deviceType,
        browser,
        os,
        ipAddress: ipAddress || "Unknown",
        location: "India",
        userAgent,
        token,
        isActive: true,
        lastActivity: new Date(),
        expiresAt,
      },
    });

    return session;
  } catch (error) {
    console.error("Error creating session:", error);
    throw error;
  }
};

/**
 * Update session activity
 */
export const updateSessionActivity = async (token: string): Promise<void> => {
  try {
    await prisma.userSession.update({
      where: { token },
      data: { lastActivity: new Date() },
    });
  } catch (error) {
    console.log("Session not found for activity update");
  }
};

/**
 * Revoke a specific session
 */
export const revokeSession = async (
  sessionId: string,
  userId: string,
): Promise<{ message: string }> => {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
  });

  if (!session) {
    throw new Error("Session not found or unauthorized");
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false },
  });

  return { message: "Session revoked successfully" };
};

/**
 * Logout from all sessions
 */
export const revokeAllSessions = async (
  userId: string,
  exceptToken: string,
): Promise<{ message: string }> => {
  await prisma.userSession.updateMany({
    where: {
      userId,
      token: { not: exceptToken },
      isActive: true,
    },
    data: { isActive: false },
  });

  return { message: "All other sessions logged out successfully" };
};

/**
 * Get user security settings
 */
export const getUserSecuritySettings = async (
  userId: string,
): Promise<SecuritySettings | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      readReceipts: true,
      dataSharing: true,
      profileVisibility: true,
    },
  });

  return user;
};

/**
 * Update user security settings
 */
export const updateSecuritySettings = async (
  userId: string,
  settings: Partial<SecuritySettings>,
): Promise<SecuritySettings | null> => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(settings.twoFactorEnabled !== undefined && {
        twoFactorEnabled: settings.twoFactorEnabled,
      }),
      ...(settings.readReceipts !== undefined && {
        readReceipts: settings.readReceipts,
      }),
      ...(settings.dataSharing !== undefined && {
        dataSharing: settings.dataSharing,
      }),
      ...(settings.profileVisibility !== undefined && {
        profileVisibility: settings.profileVisibility,
      }),
    },
    select: {
      twoFactorEnabled: true,
      readReceipts: true,
      dataSharing: true,
      profileVisibility: true,
    },
  });

  return updated;
};
