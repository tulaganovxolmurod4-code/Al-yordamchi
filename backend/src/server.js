import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { telegramAuthMiddleware } from "./middleware/telegramAuth.js";
import chatRoutes from "./routes/chat.js";
import memoryRoutes from "./routes/memory.js";
import botRelayRoutes from "./routes/botRelay.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "8mb" }));
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "*").split(",").map((s) => s.trim()),
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, slow down." },
});
app.use("/api", limiter);

app.get("/health", (req, res) => res.json({ status: "ok", online: true }));

// Server-to-server route used by the bot process; protected by its own shared secret.
app.use("/api", botRelayRoutes);

// Every route below requires a valid Telegram WebApp session.
app.use("/api", telegramAuthMiddleware);
app.use("/api", chatRoutes);
app.use("/api", memoryRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "JARVIS is temporarily unavailable." });
});

app.listen(PORT, () => {
  console.log(`JARVIS backend listening on port ${PORT}`);
});
