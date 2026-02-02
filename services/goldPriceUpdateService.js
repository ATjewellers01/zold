const goldService = require('./goldService');

let updateInterval = null;
let io = null;

/**
 * Fetch and broadcast gold price updates
 */
const fetchAndBroadcastPrices = async () => {
  try {
    console.log('Fetching live gold prices...');
    
    // Fetch current gold rate from API
    const goldRate = await goldService.getCurrentGoldRate();
    
    const priceUpdate = {
      buyRate: parseFloat(goldRate.buyRate),
      sellRate: parseFloat(goldRate.sellRate),
      timestamp: new Date().toISOString(),
      source: goldRate.source || 'database'
    };
    
    console.log(`Broadcasting price update: Buy ₹${priceUpdate.buyRate}, Sell ₹${priceUpdate.sellRate}`);
    
    // Broadcast to all connected clients
    if (io) {
      io.emit('goldPriceUpdate', priceUpdate);
    }
    
    return priceUpdate;
  } catch (error) {
    console.error('Error fetching/broadcasting gold prices:', error.message);
    
    // Broadcast error to clients
    if (io) {
      io.emit('goldPriceError', {
        error: 'Failed to fetch gold prices',
        timestamp: new Date().toISOString()
      });
    }
  }
};

/**
 * Start periodic gold price updates
 * @param {Socket.IO Server} socketIo - Socket.IO server instance
 * @param {number} intervalSeconds - Update interval in seconds (default: 30)
 */
const startGoldPriceUpdates = (socketIo, intervalSeconds = 30) => {
  io = socketIo;
  
  console.log(`Starting gold price updates every ${intervalSeconds} seconds`);
  
  // Fetch immediately on startup
  fetchAndBroadcastPrices();
  
  // Set up periodic updates
  updateInterval = setInterval(() => {
    fetchAndBroadcastPrices();
  }, intervalSeconds * 1000);
  
  // Handle manual refresh requests from clients
  io.on('connection', (socket) => {
    // Send current price immediately when client connects
    fetchAndBroadcastPrices();
    
    // Listen for manual refresh requests
    socket.on('requestPriceUpdate', async () => {
      console.log('Manual price update requested by client:', socket.id);
      await fetchAndBroadcastPrices();
    });
  });
};

/**
 * Stop periodic updates (for cleanup)
 */
const stopGoldPriceUpdates = () => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log('Stopped gold price updates');
  }
};

module.exports = {
  startGoldPriceUpdates,
  stopGoldPriceUpdates,
  fetchAndBroadcastPrices
};
