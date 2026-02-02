const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const UAParser = require('ua-parser-js');

/**
 * Get all active sessions for a user
 */
const getUserSessions = async (userId) => {
  const sessions = await prisma.userSession.findMany({
    where: { userId },
    orderBy: [
      { isActive: 'desc' },
      { lastActivity: 'desc' }
    ]
  });

  return sessions;
};

/**
 * Create a new session when user logs in
 */
const createSession = async (userId, token, userAgent, ipAddress) => {
  try {
    // Parse user agent to get device/browser info
    const parser =new UAParser(userAgent);
    const result = parser.getResult();
    
    const deviceName = result.browser.name || 'Unknown Browser';
    const deviceType = result.device.type || 'desktop';
    const browser = result.browser.name || 'Unknown';
    const os = result.os.name || 'Unknown OS';
    
    // Create session expiry (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.userSession.create({
      data: {
        userId,
        deviceName: `${deviceName} on ${os}`,
        deviceType,
        browser,
        os,
        ipAddress: ipAddress || 'Unknown',
        location: 'India', // You can use IP geolocation API for real location
        userAgent,
        token,
        isActive: true,
        lastActivity: new Date(),
        expiresAt
      }
    });

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

/**
 * Update session activity
 */
const updateSessionActivity = async (token) => {
  try {
    await prisma.userSession.update({
      where: { token },
      data: { lastActivity: new Date() }
    });
  } catch (error) {
    // Session might not exist, that's okay
    console.log('Session not found for activity update');
  }
};

/**
 * Revoke a specific session
 */
const revokeSession = async (sessionId, userId) => {
  const session = await prisma.userSession.findFirst({
    where: {
      id: sessionId,
      userId
    }
  });

  if (!session) {
    throw new Error('Session not found or unauthorized');
  }

  await prisma.userSession.update({
    where: { id: sessionId },
    data: { isActive: false }
  });

  return { message: 'Session revoked successfully' };
};

/**
 * Logout from all sessions
 */
const revokeAllSessions = async (userId, exceptToken) => {
  await prisma.userSession.updateMany({
    where: {
      userId,
      token: { not: exceptToken }, // Don't logout current session
      isActive: true
    },
    data: { isActive: false }
  });

  return { message: 'All other sessions logged out successfully' };
};

/**
 * Get user security settings
 */
const getUserSecuritySettings = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      twoFactorEnabled: true,
      readReceipts: true,
      dataSharing: true,
      profileVisibility: true
    }
  });

  return user;
};

/**
 * Update user security settings
 */
const updateSecuritySettings = async (userId, settings) => {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(settings.twoFactorEnabled !== undefined && { twoFactorEnabled: settings.twoFactorEnabled }),
      ...(settings.readReceipts !== undefined && { readReceipts: settings.readReceipts }),
      ...(settings.dataSharing !== undefined && { dataSharing: settings.dataSharing }),
      ...(settings.profileVisibility !== undefined && { profileVisibility: settings.profileVisibility })
    },
    select: {
      twoFactorEnabled: true,
      readReceipts: true,
      dataSharing: true,
      profileVisibility: true
    }
  });

  return updated;
};

module.exports = {
  getUserSessions,
  createSession,
  updateSessionActivity,
  revokeSession,
  revokeAllSessions,
  getUserSecuritySettings,
  updateSecuritySettings
};
