import prisma from "../config/db.js";

export const getReferralStatsService = async (userId: string) => {
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

  if (!user) throw new Error("User not found");

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

  return {
    referralCode: user.referralCode,
    stats: {
      totalReferrals,
      totalEarned,
      pendingReferrals,
    },
    history,
  };
};
