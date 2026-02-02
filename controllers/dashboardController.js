const prisma = require('../config/db');

// Get comprehensive admin dashboard metrics
exports.getDashboardMetrics = async (req, res) => {
  try {
    // Total users
    const totalUsers = await prisma.user.count();
    
    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: true,
    });
    
    // Total gold holdings & rupee balance
    const walletsSum = await prisma.wallet.aggregate({
      _sum: { 
        goldBalance: true, 
        pledgedGold: true,
        rupeeBalance: true 
      }
    });
    
    const freeGold = (walletsSum._sum.goldBalance || 0) - (walletsSum._sum.pledgedGold || 0);
    
    // Today's transactions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await prisma.goldTransaction.aggregate({
      where: { 
        createdAt: { gte: today },
        status: 'COMPLETED'
      },
      _count: true,
      _sum: { finalAmount: true, goldGrams: true }
    });
    
    // Buy vs Sell today
    const todayBuy = await prisma.goldTransaction.aggregate({
      where: { 
        createdAt: { gte: today },
        type: 'BUY',
        status: 'COMPLETED'
      },
      _sum: { finalAmount: true }
    });
    
    const todaySell = await prisma.goldTransaction.aggregate({
      where: { 
        createdAt: { gte: today },
        type: 'SELL',
        status: 'COMPLETED'
      },
      _sum: { finalAmount: true }
    });
    
    // This week's transactions
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weekTransactions = await prisma.goldTransaction.aggregate({
      where: { 
        createdAt: { gte: weekAgo },
        status: 'COMPLETED'
      },
      _count: true,
      _sum: { finalAmount: true }
    });
    
    // This month's transactions
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const monthTransactions = await prisma.goldTransaction.aggregate({
      where: { 
        createdAt: { gte: monthAgo },
        status: 'COMPLETED'
      },
      _count: true,
      _sum: { finalAmount: true }
    });
    
    // Pending KYC
    const pendingKYC = await prisma.kyc.count({
      where: { status: 'PENDING' }
    });
    
    const approvedKYC = await prisma.kyc.count({
      where: { status: 'APPROVED' }
    });
    
    // Active partners
    const activePartners = await prisma.partner.count({
      where: { isActive: true }
    });
    
    // Current active gold rate
    const currentRate = await prisma.goldRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Recent transactions (last 10)
    const recentTransactions = await prisma.goldTransaction.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { 
            name: true, 
            email: true,
            phone: true 
          }
        }
      }
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          usersByRole,
          totalGoldHoldings: Number(walletsSum._sum.goldBalance) || 0,
          pledgedGold: Number(walletsSum._sum.pledgedGold) || 0,
          freeGold: Number(freeGold),
          totalRupeeBalance: Number(walletsSum._sum.rupeeBalance) || 0,
          pendingKYC,
          approvedKYC,
          activePartners
        },
        transactions: {
          today: {
            count: todayTransactions._count,
            volume: Number(todayTransactions._sum.finalAmount) || 0,
            goldVolume: Number(todayTransactions._sum.goldGrams) || 0,
            buyVolume: Number(todayBuy._sum.finalAmount) || 0,
            sellVolume: Number(todaySell._sum.finalAmount) || 0
          },
          week: {
            count: weekTransactions._count,
            volume: Number(weekTransactions._sum.finalAmount) || 0
          },
          month: {
            count: monthTransactions._count,
            volume: Number(monthTransactions._sum.finalAmount) || 0
          }
        },
        currentGoldRate: currentRate ? {
          buyRate: Number(currentRate.buyRate),
          sellRate: Number(currentRate.sellRate),
          spread: currentRate.spread,
          updatedAt: currentRate.createdAt
        } : null,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get transaction analytics for charts
exports.getTransactionAnalytics = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Get all transactions in period
    const transactions = await prisma.goldTransaction.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'COMPLETED'
      },
      select: {
        type: true,
        finalAmount: true,
        goldGrams: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Group by date
    const dailyData = {};
    
    transactions.forEach(txn => {
      const date = txn.createdAt.toISOString().split('T')[0];
      
      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          count: 0,
          volume: 0,
          buyCount: 0,
          sellCount: 0,
          buyVolume: 0,
          sellVolume: 0,
          goldVolume: 0
        };
      }
      
      dailyData[date].count++;
      dailyData[date].volume += Number(txn.finalAmount);
      dailyData[date].goldVolume += Number(txn.goldGrams);
      
      if (txn.type === 'BUY') {
        dailyData[date].buyCount++;
        dailyData[date].buyVolume += Number(txn.finalAmount);
      } else {
        dailyData[date].sellCount++;
        dailyData[date].sellVolume += Number(txn.finalAmount);
      }
    });
    
    const analyticsData = Object.values(dailyData);
    
    res.json({ success: true, data: analyticsData });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get user growth analytics
exports.getUserGrowthAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    const days = period === '90d' ? 90 : 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        role: true
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Group by date
    const dailyGrowth = {};
    
    users.forEach(user => {
      const date = user.createdAt.toISOString().split('T')[0];
      
      if (!dailyGrowth[date]) {
        dailyGrowth[date] = {
          date,
          newUsers: 0,
          newAdmins: 0,
          newPartners: 0
        };
      }
      
      dailyGrowth[date].newUsers++;
      if (user.role === 'ADMIN') dailyGrowth[date].newAdmins++;
      if (user.role === 'PARTNER') dailyGrowth[date].newPartners++;
    });
    
    res.json({ success: true, data: Object.values(dailyGrowth) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
