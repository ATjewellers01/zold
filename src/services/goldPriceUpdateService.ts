import { Server, Socket } from "socket.io";
import * as goldService from "./goldService.js";

let updateInterval: NodeJS.Timeout | null = null;
let io: Server | null = null;

interface PriceUpdate {
  buyRate: number;
  sellRate: number;
  timestamp: string;
  source: string;
}

/**
 * Fetch and broadcast gold price updates
 */
const fetchAndBroadcastPrices = async (): Promise<PriceUpdate | undefined> => {
  try {
    console.log("Fetching live gold prices...");

    const goldRate = await goldService.getCurrentGoldRate();

    const priceUpdate: PriceUpdate = {
      buyRate: parseFloat(String(goldRate.buyRate)),
      sellRate: parseFloat(String(goldRate.sellRate)),
      timestamp: new Date().toISOString(),
      source: (goldRate as any).source || "database",
    };

    console.log(
      `Broadcasting price update: Buy ₹${priceUpdate.buyRate}, Sell ₹${priceUpdate.sellRate}`,
    );

    if (io) {
      io.emit("goldPriceUpdate", priceUpdate);
    }

    return priceUpdate;
  } catch (error: any) {
    console.error("Error fetching/broadcasting gold prices:", error.message);

    if (io) {
      io.emit("goldPriceError", {
        error: "Failed to fetch gold prices",
        timestamp: new Date().toISOString(),
      });
    }
  }
};

/**
 * Start periodic gold price updates
 */
export const startGoldPriceUpdates = (
  socketIo: Server,
  intervalSeconds: number = 30,
): void => {
  io = socketIo;

  console.log(`Starting gold price updates every ${intervalSeconds} seconds`);

  fetchAndBroadcastPrices();

  updateInterval = setInterval(() => {
    fetchAndBroadcastPrices();
  }, intervalSeconds * 1000);

  io.on("connection", (socket: Socket) => {
    fetchAndBroadcastPrices();

    socket.on("requestPriceUpdate", async () => {
      console.log("Manual price update requested by client:", socket.id);
      await fetchAndBroadcastPrices();
    });
  });
};

/**
 * Stop periodic updates (for cleanup)
 */
export const stopGoldPriceUpdates = (): void => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
    console.log("Stopped gold price updates");
  }
};

export { fetchAndBroadcastPrices };
