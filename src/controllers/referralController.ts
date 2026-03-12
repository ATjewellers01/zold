import { Response } from "express";
import { AuthenticatedRequest } from "../types/index.js";
import prisma from "../config/db.js";

export const getReferralStats = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                name: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const totalReferrals = user.referrals.length;
    const completedReferrals = user.referrals.filter(
      (r) => r.status === "COMPLETED",
    ).length;
    const pendingReferrals = user.referrals.filter(
      (r) => r.status === "PENDING",
    ).length;

    const totalEarned = user.referrals.reduce((sum, r) => {
      return r.status === "COMPLETED"
        ? sum + parseFloat(String(r.rewardAmount))
        : sum;
    }, 0);

    const history = user.referrals.map((r) => ({
      name: r.referredUser.name,
      date: r.createdAt.toISOString().split("T")[0],
      status: r.status.toLowerCase(),
      earning:
        r.status === "COMPLETED" ? parseFloat(String(r.rewardAmount)) : 0,
    }));

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        stats: {
          totalReferrals,
          totalEarned,
          pendingReferrals,
        },
        history,
      },
    });
  } catch (error: any) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral stats",
      error: error.message,
    });
  }
};
