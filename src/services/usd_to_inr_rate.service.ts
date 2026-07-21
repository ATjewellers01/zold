import axios from "axios"

let cachedINRRate = 83.5;
let lastFetchedAt = 0;

export const getUSDToINRRate = async ():
Promise<number> => {
    const FOUR_HOURS = 4 * 60 * 60 * 1000;

    if(Date.now() - lastFetchedAt < FOUR_HOURS) {
        return cachedINRRate;
    }

    try {
        const response = await axios.get(`https://open.er-api.com/v6/latest/USD`);
        cachedINRRate = response.data.rates.INR;
        lastFetchedAt = Date.now();
        return cachedINRRate;
    }
    catch(error) {
        console.log("Failed to fetch exchange rate, using default rate");
        return cachedINRRate;
    }
};