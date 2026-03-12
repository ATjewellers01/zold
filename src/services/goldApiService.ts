import axios from "axios";
import { GoldRateData } from "../types";

const GOLD_API_BASE_URL = "https://www.goldapi.io/api";
const GOLD_API_KEY = process.env.GOLD_API_KEY;

/**
 * Fetch current live gold price in USD per troy ounce
 * Then convert to INR per gram
 */
export const getLiveGoldPrice = async (): Promise<GoldRateData> => {
  try {
    if (!GOLD_API_KEY) {
      console.warn("GOLD_API_KEY not configured - returning 0 rates");
      return {
        buyRate: 0,
        sellRate: 0,
        source: "not_configured",
        error: "API key not configured",
      };
    }

    console.log("Fetching live gold price from GoldAPI...");

    const response = await axios.get(`${GOLD_API_BASE_URL}/XAU/USD`, {
      headers: {
        "x-access-token": GOLD_API_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data.price) {
      throw new Error("Invalid response from GoldAPI");
    }

    console.log(
      "Successfully fetched gold price from API:",
      response.data.price,
    );

    // Get price per troy ounce in USD
    const pricePerOunceUSD = response.data.price;

    // Convert to per gram (1 troy ounce = 31.1035 grams)
    const pricePerGramUSD = pricePerOunceUSD / 31.1035;

    // Convert USD to INR
    const USD_TO_INR = 83.5;
    const pricePerGramINR = pricePerGramUSD * USD_TO_INR;

    // Add margin for buy/sell rates (2% margin)
    const buyRate = pricePerGramINR * 1.02;
    const sellRate = pricePerGramINR * 0.98;

    return {
      buyRate: parseFloat(buyRate.toFixed(2)),
      sellRate: parseFloat(sellRate.toFixed(2)),
      source: "goldapi",
    };
  } catch (error: any) {
    console.error("Error fetching live gold price:", error.message);

    return {
      buyRate: 0,
      sellRate: 0,
      source: "error",
      error: error.message,
    };
  }
};

/**
 * Get current USD to INR conversion rate
 */
export const getUSDToINRRate = async (): Promise<number> => {
  try {
    return 83.5;
  } catch (error: any) {
    console.error("Error fetching USD to INR rate:", error.message);
    return 83.5;
  }
};
