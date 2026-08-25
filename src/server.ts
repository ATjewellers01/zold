import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config();

import indexRoutes from "./routes/index.js";
import { startScheduler } from "./services/scheduler_service.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser());

const server = http.createServer(app);

const isProd = process.env.NODE_ENV === "production";

const allowedOrigins = [
  "http://localhost:3005",
  "http://localhost:3000",
  "https://zold-frontend-mzjh.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Always use a function-based origin so we can set credentials: true.
// origin: "*" is incompatible with credentials: true (browsers reject it).
const corsOrigin = function (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  // Allow requests with no origin (Postman, server-to-server, health checks).
  if (!origin) {
    callback(null, true);
    return;
  }
  if (!isProd || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error(`CORS: origin ${origin} not allowed`));
  }
};

const corsOptions: cors.CorsOptions = {
  origin: corsOrigin,
  credentials: true, // required for httpOnly cookies to be sent cross-origin
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", indexRoutes);

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinRoom", (userId: string) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);

  startScheduler().catch((e) => console.error("[Scheduler] Failed to start:", e));

  import("./services/metal_price_update.service.js").then(
    ({ startMetalPriceUpdates }) => {
      startMetalPriceUpdates(io);
    },
  );
});

export { app, io };
// Server updated

