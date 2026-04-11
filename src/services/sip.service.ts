// import prisma from "../config/db.js"
// import { getCurrentGoldRate, getCurrentSilverRate } from "./metalRateService.js"

// const createSip = async (
//     user_id: string,
//     name: string,
//     metal: "GOLD" | "SILVER",
//     amount: number,
//     frequency: "DAILY" | "WEEKLY" | "MONTHLY",
//     day_of_week: number,
//     day_of_month: number,
//     start_date,
//     status: "ACTIVE" | "PAUSED" | "CANCELLED" | "COMPLETED",
// ) => {
//     const sip = await prisma.$transaction(async (tx) => {
//         const goldPrice = await getCurrentGoldRate();
//         const silverPrice = await getCurrentSilverRate();

//         if(metal === "GOLD" && goldPrice.buyRate <= 0) {
//             throw new Error("Gold rate unavailable");
//         }
//         if(metal === "SILVER" && silverPrice.buyRate <= 0) {
//             throw new Error("Silver rate unavailable");
//         }

//         const totalGramsPurchased = metal === "GOLD" ? amount/goldPrice.buyRate : amount/silverPrice.buyRate;

//         tx.sip.create({
//             data: {
//                 user_id,
//                 name,
//                 metal,

//             }
//         })
//     })
// }