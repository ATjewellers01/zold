const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

/**
 * Get referral stats for the current user
 */
const getReferralStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user details (referral code) and referrals
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          include: {
            referredUser: {
              select: {
                name: true,
                createdAt: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const totalReferrals = user.referrals.length;
    const completedReferrals = user.referrals.filter(r => r.status === 'COMPLETED').length;
    const pendingReferrals = user.referrals.filter(r => r.status === 'PENDING').length;
    
    // Calculate total earned
    const totalEarned = user.referrals.reduce((sum, r) => {
      return r.status === 'COMPLETED' ? sum + parseFloat(r.rewardAmount) : sum;
    }, 0);

    // Format history
    const history = user.referrals.map(r => ({
      name: r.referredUser.name,
      date: r.createdAt.toISOString().split('T')[0],
      status: r.status.toLowerCase(),
      earning: r.status === 'COMPLETED' ? parseFloat(r.rewardAmount) : 0
    }));

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        stats: {
          totalReferrals,
          totalEarned,
          pendingReferrals
        },
        history
      }
    });

  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral stats',
      error: error.message
    });
  }
};

module.exports = {
  getReferralStats
};
