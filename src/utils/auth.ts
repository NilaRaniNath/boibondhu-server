import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "../types";

function getAccessSecret() { return process.env.JWT_SECRET || "dev_access_secret"; }
function getRefreshSecret() { return process.env.JWT_REFRESH_SECRET || "dev_refresh_secret"; }
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, getAccessSecret(), { expiresIn: ACCESS_EXPIRY });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, getRefreshSecret(), { expiresIn: REFRESH_EXPIRY });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, getAccessSecret()) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload;
}
