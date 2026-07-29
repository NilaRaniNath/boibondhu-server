import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB, closeDB } from "./lib/db";
import authRoutes from "./routes/auth";
import bookRoutes from "./routes/book.routes";
import orderRoutes from "./routes/order.routes";
import reviewRoutes from "./routes/review.routes";
import adminRoutes from "./routes/admin.routes";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ success: true, message: "BoiBondhu API is running" });
});

app.get("/.well-known/appspecific/com.chrome.devtools.json", (_req, res) => res.status(204).end());
app.get("/favicon.ico", (_req, res) => res.status(204).end());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "BoiBondhu API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();

process.on("SIGINT", async () => {
  await closeDB();
  process.exit(0);
});
