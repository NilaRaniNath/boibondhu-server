const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDB } = require("../dist/lib/db");

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({ success: true, message: "BoiBondhu API is running!" });
});

app.get("/favicon.ico", (_req, res) => {
  res.status(204).end();
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "BoiBondhu API is running" });
});

const authRoutes = require("../dist/routes/auth").default;
const bookRoutes = require("../dist/routes/book.routes").default;
const orderRoutes = require("../dist/routes/order.routes").default;
const reviewRoutes = require("../dist/routes/review.routes").default;
const adminRoutes = require("../dist/routes/admin.routes").default;

app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/admin", adminRoutes);

connectDB().catch(console.error);

module.exports = app;
