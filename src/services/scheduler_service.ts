import cron from "node-cron";
import { clearOldSessionsService } from "./session_cleaner.service.js";

const runCleanup = async () => {
    console.log("[Scheduler] Running session cleanup...");
    try {
        await clearOldSessionsService();
        console.log("[Scheduler] Session cleanup completed");
    } catch (error) {
        console.error("[Scheduler] Session cleanup failed:", error);
    }
};

export const startScheduler = async () => {
    await runCleanup();

    cron.schedule("*/5 * * * *", runCleanup);

    console.log("[Scheduler] Cron jobs started — session cleanup every 5 minutes");
};