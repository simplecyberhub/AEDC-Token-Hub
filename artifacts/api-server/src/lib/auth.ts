import jwt from "jsonwebtoken";
import { logger } from "./logger";

const JWT_SECRET = process.env["SESSION_SECRET"] ?? "aedc-dev-secret-key-change-in-prod";
const JWT_EXPIRES_IN = "30d";

export interface JwtPayload {
  userId: number;
  email: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    logger.warn("Invalid JWT token");
    return null;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}
