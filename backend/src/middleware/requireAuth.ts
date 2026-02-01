import type { Request, Response, NextFunction } from "express";
import { getTokenFromRequest, verifyAccessToken } from "../lib/auth";

export type AuthedRequest = Request & {
  userId?: string;
  auth?: {
    userId: string;
    email?: string;
  };
};

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const payload = verifyAccessToken(token);
    req.userId = payload.userId;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}
