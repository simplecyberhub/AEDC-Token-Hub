import type { Request, Response, NextFunction } from "express";
import { verifyToken, extractBearerToken } from "../lib/auth";

export interface AuthRequest<Q = any, B = any, P = any> extends Request<P, any, B, Q> {
  userId?: number;
  userEmail?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}
