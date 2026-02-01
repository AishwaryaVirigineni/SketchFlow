import jwt from "jsonwebtoken";
import type { Request } from "express";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

export type JwtPayload = {
  userId: string;
  email?: string;
};

export const AUTH_COOKIE = "wb_token";

/**
 * Sign JWT
 */
export function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET!, {
    expiresIn: "7d",
  });
}

/**
 * Verify JWT
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET!) as JwtPayload;
}

/**
 * Cookie config
 */
import type { CookieOptions } from "express";

export function cookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}


/**
 * Extract token from cookie or Authorization header
 */
export function getTokenFromRequest(req: Request): string | null {
  const cookieToken = (req as any).cookies?.[AUTH_COOKIE];
  if (cookieToken && typeof cookieToken === "string") {
    return cookieToken;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}
