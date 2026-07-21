import { Server, Socket } from "socket.io";
import { getCurrentGoldRate, getCurrentSilverRate } from "./metal_rate.service.js";

let updateInterval: NodeJS.Timeout | null = null;
let io: Server | null = null;

interface PriceUpdate {
  buyRate: number;
  sellRate: number;
  timestamp: string;
  source: string;
}

let lastGoldUpdate: PriceUpdate | null = null;
let lastSilverUpdate: PriceUpdate | null = null;

const fetchAndBroadcastPrices = async (): Promise<void> => {
  try {
    console.log("Fetching live metal prices...");

    const [goldRate, silverRate] = await Promise.all([
      getCurrentGoldRate(),
      getCurrentSilverRate(),
    ]);

    lastGoldUpdate = {
      buyRate: parseFloat(String(goldRate.buyRate)),
      sellRate: parseFloat(String(goldRate.sellRate)),
      timestamp: new Date().toISOString(),
      source: (goldRate as any).source || "database",
    };

    lastSilverUpdate = {
      buyRate: parseFloat(String(silverRate.buyRate)),
      sellRate: parseFloat(String(silverRate.sellRate)),
      timestamp: new Date().toISOString(),
      source: (silverRate as any).source || "database",
    };

    console.log(`Broadcasting GOLD: Buy ₹${lastGoldUpdate.buyRate}, Sell ₹${lastGoldUpdate.sellRate}`);
    console.log(`Broadcasting SILVER: Buy ₹${lastSilverUpdate.buyRate}, Sell ₹${lastSilverUpdate.sellRate}`);

    if (io) {
      io.emit("goldPriceUpdate", lastGoldUpdate);
      io.emit("silverPriceUpdate", lastSilverUpdate);
    }
  } catch (error: any) {
    console.error("Error fetching/broadcasting metal prices:", error.message);

    if (io) {
      io.emit("metalPriceError", {
        error: "Failed to fetch metal prices",
        timestamp: new Date().toISOString(),
      });
    }
  }
};

export const startMetalPriceUpdates = (
  socketIo: Server,
  intervalSeconds: number = 30,
): void => {
  io = socketIo;

  console.log(`Starting metal price updates every ${intervalSeconds} seconds`);

  // Fetch once immediately on server start
  fetchAndBroadcastPrices();

  updateInterval = setInterval(fetchAndBroadcastPrices, intervalSeconds * 1000);

  io.on("connection", (socket: Socket) => {
    // Send last known prices instantly — no re-fetch, no race condition
    if (lastGoldUpdate) socket.emit("goldPriceUpdate", lastGoldUpdate);
    if (lastSilverUpdate) socket.emit("silverPriceUpdate", lastSilverUpdate);

    socket.on("requestPriceUpdate", async () => {
      console.log("Manual price update requested by client:", socket.id);
      await fetchAndBroadcastPrices();
    });
  });
};

export const stopMetalPriceUpdates = (): void => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log("Stopped metal price updates");
  }
};

export { fetchAndBroadcastPrices };
