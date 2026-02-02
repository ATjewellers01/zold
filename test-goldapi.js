// Test script to verify GoldAPI connection
const axios = require('axios');
require('dotenv').config();

const GOLD_API_BASE_URL = 'https://www.goldapi.io/api';
const GOLD_API_KEY = process.env.GOLD_API_KEY;

async function testGoldAPI() {
  console.log('='.repeat(60));
  console.log('GOLDAPI CONNECTION TEST');
  console.log('='.repeat(60));
  
  // Check if API key is set
  console.log('\n1. Checking API Key Configuration:');
  if (!GOLD_API_KEY) {
    console.log('   ❌ GOLD_API_KEY is NOT set in .env file');
    console.log('   ⚠️  Please add: GOLD_API_KEY=your-actual-key-here');
    console.log('   📝 Get your key from: https://www.goldapi.io');
    return;
  }
  
  console.log(`   ✅ GOLD_API_KEY is set (${GOLD_API_KEY.length} characters)`);
  console.log(`   🔑 Key: ${GOLD_API_KEY.substring(0, 10)}...`);
  
  // Test API connection
  console.log('\n2. Testing API Connection:');
  console.log('   🌐 Calling: GET ' + GOLD_API_BASE_URL + '/XAU/USD');
  
  try {
    const response = await axios.get(`${GOLD_API_BASE_URL}/XAU/USD`, {
      headers: {
        'x-access-token': GOLD_API_KEY
      },
      timeout: 10000
    });
    
    console.log('   ✅ API connection successful!');
    console.log('\n3. Response Data:');
    console.log('   Price per oz (USD):', response.data.price);
    console.log('   Metal:', response.data.metal);
    console.log('   Currency:', response.data.currency);
    
    // Calculate INR conversion
    console.log('\n4. Conversion to INR per gram:');
    const pricePerOunceUSD = response.data.price;
    const pricePerGramUSD = pricePerOunceUSD / 31.1035;
    const USD_TO_INR = 83.5;
    const pricePerGramINR = pricePerGramUSD * USD_TO_INR;
    const buyRate = pricePerGramINR * 1.02;
    const sellRate = pricePerGramINR * 0.98;
    
    console.log('   Price per oz (USD):', pricePerOunceUSD.toFixed(2));
    console.log('   Price per gram (USD):', pricePerGramUSD.toFixed(2));
    console.log('   Price per gram (INR):', pricePerGramINR.toFixed(2));
    console.log('   Buy rate (+2%):', buyRate.toFixed(2));
    console.log('   Sell rate (-2%):', sellRate.toFixed(2));
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ TEST PASSED - API is working correctly!');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.log('   ❌ API connection failed!');
    console.log('\n3. Error Details:');
    
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Message:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n   ⚠️  Authentication failed - Invalid API key');
        console.log('   💡 Please verify your API key at https://www.goldapi.io');
      }
    } else {
      console.log('   Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('❌ TEST FAILED');
    console.log('='.repeat(60));
  }
}

testGoldAPI();
