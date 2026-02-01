import { Router } from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { AUTH_COOKIE, cookieOptions, signAccessToken } from "../lib/auth";

import { requireAuth, type AuthedRequest } from "../middleware/requireAuth";
import { pickRandomColor, initialsFromName } from "../utils/userDefaults";

import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET!;


const prisma = new PrismaClient();
export const authRouter = Router();

function pickSafeUser(u: any) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    avatar: u.avatar ?? null,
    color: u.color ?? null,
    createdAt: u.createdAt,
  };
}

authRouter.post("/signup", async (req, res) => {
  const { email, password, name } = req.body ?? {};

  if (!email || !password || !name) {
    return res.status(400).json({ error: "email, password, name are required" });
  }

  if (typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid payload" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      name,
      color: pickRandomColor(),
      avatar: initialsFromName(name),
    },
  });

  const token = signAccessToken({ userId: user.id, email: user.email });
  res.cookie(AUTH_COOKIE, token, cookieOptions());

  return res.json({ token, user: pickSafeUser(user) });
});

// authRouter.post("/login", async (req, res) => {
//   const { email, password } = req.body ?? {};

//   if (!email || !password) {
//     return res.status(400).json({ error: "email and password are required" });
//   }

//   const user = await prisma.user.findUnique({ where: { email } });
//   if (!user) return res.status(401).json({ error: "Invalid credentials" });

//   const ok = await bcrypt.compare(password, user.password);
//   if (!ok) return res.status(401).json({ error: "Invalid credentials" });

//   const token = signAccessToken({ userId: user.id, email: user.email });
//   res.cookie(AUTH_COOKIE, token, cookieOptions());

//   return res.json({ user: pickSafeUser(user) });
// });

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      color: user.color,
    },
  });
});


authRouter.post("/logout", async (_req, res) => {
  res.clearCookie(AUTH_COOKIE, { path: "/" });
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const userId = req.auth!.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: "Not authenticated" });

  return res.json({ user: pickSafeUser(user) });
});


export default authRouter;