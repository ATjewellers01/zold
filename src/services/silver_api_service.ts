import axios from "axios";
import { getUSDToINRRate } from "./usd_to_inr_rate.service.js";

const SILVER_API_URL = "https://www.goldapi.io/api/XAG/USD";

export const getSilverLivePrice = async () => {
    const apiKey = process.env.GOLD_API_KEY;

    if (!apiKey) {
        console.warn("GOLD_API_KEY not configured - returning 0 rates for silver");
        return { buyRate: 0, sellRate: 0, source: "not_configured", error: "API key not configured" };
    }

    try {
        console.log("Fetching live silver price from GoldAPI...");

        const result = await axios.get(SILVER_API_URL, {
            headers: { "x-access-token": apiKey },
            timeout: 10000,
        });

        if (!result.data || !result.data.price) {
            throw new Error("Invalid response from GoldAPI");
        }

        console.log("Successfully fetched silver price from API:", result.data.price);

        const pricePerOunceUSD = result.data.price;
        const pricePerGramUSD = pricePerOunceUSD / 31.1035;

        const USD_TO_INR = await getUSDToINRRate();
        const pricePerGramINR = pricePerGramUSD * USD_TO_INR;

        const buyRate = pricePerGramINR * 1.02;
        const sellRate = pricePerGramINR * 0.98;

        return {
            buyRate: parseFloat(buyRate.toFixed(2)),
            sellRate: parseFloat(sellRate.toFixed(2)),
            source: "goldapi",
        };
    } catch (error: any) {
        console.error("Error fetching live silver price:", error.message);
        return { buyRate: 0, sellRate: 0, source: "error", error: error.message };
    }
};
