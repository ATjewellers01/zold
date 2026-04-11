import cron from "node-cron";
import { clearOldSessionsService } from "./sessionCleanerService.js";

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
};