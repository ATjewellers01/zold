import cron from "node-cron";
import { clearOldSessionsService } from "./session_cleaner.service.js";

export const startScheduler = () => {
    cron.schedule("*/5 * * * *", async () => {
        console.log("Running session cleanup...");
        try {
            await clearOldSessionsService();
        }
        catch (error) {
            console.log("Session cleanup failed:", error);
        }
    });
};