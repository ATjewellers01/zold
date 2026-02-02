const axios = require('axios');

/**
 * GoldAPI Service - Fetch live gold prices from goldapi.io
 */

const GOLD_API_BASE_URL = 'https://www.goldapi.io/api';
const GOLD_API_KEY = process.env.GOLD_API_KEY;

/**
 * Fetch current live gold price in USD per troy ounce
 * Then convert to INR per gram
 */
const getLiveGoldPrice = async () => {
  try {
    if (!GOLD_API_KEY) {
      console.warn('GOLD_API_KEY not configured - returning 0 rates');
      return {
        buyRate: 0,
        sellRate: 0,
        source: 'not_configured',
        error: 'API key not configured'
      };
    }

    console.log('Fetching live gold price from GoldAPI...');
    
    // Fetch XAU/USD rate from GoldAPI
    const response = await axios.get(`${GOLD_API_BASE_URL}/XAU/USD`, {
      headers: {
        'x-access-token': GOLD_API_KEY
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || !response.data.price) {
      throw new Error('Invalid response from GoldAPI');
    }

    console.log('Successfully fetched gold price from API:', response.data.price);

    // Get price per troy ounce in USD
    const pricePerOunceUSD = response.data.price;
    
    // Convert to per gram (1 troy ounce = 31.1035 grams)
    const pricePerGramUSD = pricePerOunceUSD / 31.1035;
    
    // Convert USD to INR (approximate rate, you can use a currency API for live conversion)
    const USD_TO_INR = 83.5; // You can make this dynamic with another API call
    const pricePerGramINR = pricePerGramUSD * USD_TO_INR;
    
    // Add margin for buy/sell rates (2% margin)
    const buyRate = pricePerGramINR * 1.02; // 2% above market
    const sellRate = pricePerGramINR * 0.98; // 2% below market
    
    return {
      buyRate: parseFloat(buyRate.toFixed(2)),
      sellRate: parseFloat(sellRate.toFixed(2)),
      source: 'goldapi',
      rawPrice: pricePerOunceUSD,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching live gold price:', error.message);
    
    // Return 0 rates if API fails - no dummy data
    return {
      buyRate: 0,
      sellRate: 0,
      source: 'error',
      error: error.message
    };
  }
};

/**
 * Get current USD to INR conversion rate
 * You can integrate with a currency API for live rates
 */
const getUSDToINRRate = async () => {
  try {
    // You can integrate with a currency API here
    // For now, returning a static rate
    return 83.5;
  } catch (error) {
    console.error('Error fetching USD to INR rate:', error.message);
    return 83.5; // Fallback rate
  }
};

module.exports = {
  getLiveGoldPrice,
  getUSDToINRRate
};
