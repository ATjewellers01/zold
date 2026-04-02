import cron from "node-cron";
import { clearOldSessionsService } from "./sessionCleanerService";
import { clearIncativeMetalRate } from "./metalRateCleanerService";

export const startScheduler = () => {
    cron.schedule("*/15 * * * *", async () => {
        console.log("Running session cleanup...");
        try {
            await clearOldSessionsService();
        }
        catch (error) {
            console.log("Session cleanup failed:", error);
        }
    });

    cron.schedule("0 0 * * 0", async () => {
        console.log("Running metal inactive prices cleanup");
        try {
            await clearIncativeMetalRate();
        }
        catch(error) {
            console.log("Metal inacative prices cleanup failed...", error);
        }
    });
};