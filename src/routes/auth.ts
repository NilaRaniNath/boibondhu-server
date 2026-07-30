import { Router, Request, Response } from "express";
import { z } from "zod";
import { getDB } from "../lib/db";
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/auth";
import type { User, JwtPayload } from "../types";
import { ObjectId } from "mongodb";

const router = Router();

const ADMIN_EMAIL = "admin@ferauni.com";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const REFRESH_COOKIE = "refreshToken";

router.post("/register", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password } = parsed.data;
    const db = await getDB();
    const users = db.collection<User>("users");

    if (email.toLowerCase() === ADMIN_EMAIL) {
      res.status(403).json({ message: "This email is reserved and cannot be used for registration" });
      return;
    }

    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const hashed = await hashPassword(password);
    const now = new Date();

    const result = await users.insertOne({
      name,
      email,
      password: hashed,
      role: "user",
      createdAt: now,
      updatedAt: now,
    });

    const tokenPayload: JwtPayload = {
      userId: result.insertedId.toString(),
      email,
      role: "user",
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.status(201).json({
      message: "Registration successful",
      accessToken,
      user: { id: result.insertedId.toString(), name, email, role: "user" },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Validation failed", errors: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;
    const db = await getDB();
    const users = db.collection<User>("users");

    const user = await users.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    const role: "user" | "admin" = user.email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user";

    const tokenPayload: JwtPayload = {
      userId: user._id!.toString(),
      email: user.email,
      role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: { id: user._id!.toString(), name: user.name, email: user.email, role },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/refresh", async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies[REFRESH_COOKIE];
    if (!token) {
      res.status(401).json({ message: "Refresh token not found" });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const db = await getDB();
    const users = db.collection<User>("users");
    const user = await users.findOne({ _id: new ObjectId(decoded.userId) });

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    const role: "user" | "admin" = user.email.toLowerCase() === ADMIN_EMAIL ? "admin" : "user";

    const tokenPayload: JwtPayload = {
      userId: user._id!.toString(),
      email: user.email,
      role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.json({ accessToken, user: { id: user._id!.toString(), name: user.name, email: user.email, role } });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", (_req: Request, res: Response): void => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/auth",
  });
  res.json({ message: "Logged out successfully" });
});

export default router;
