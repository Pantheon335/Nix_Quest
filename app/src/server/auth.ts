import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByUsername } from "./store.js";

const SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";
const COOKIE = "token";
const isProd = process.env.NODE_ENV === "production";

if (isProd && SECRET === "dev-secret-change-me") {
  throw new Error("JWT_SECRET must be set in production");
}

export interface AuthUser {
  uid: number;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function issueCookie(res: Response, user: AuthUser): void {
  const token = jwt.sign(user, SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

/** Populate req.user from the cookie if present and valid. Never blocks. */
export function authFromCookie(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[COOKIE];
  if (token) {
    try {
      req.user = jwt.verify(token, SECRET) as unknown as AuthUser;
    } catch {
      /* invalid/expired token — treat as anonymous */
    }
  }
  next();
}

/** Gate routes that require a logged-in solo player. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: "login required" });
    return;
  }
  next();
}

const credentials = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[\w.-]+$/, "letters, numbers, dot, dash, underscore only"),
  password: z.string().min(6).max(128),
});

export const authRouter = Router();

authRouter.post("/register", (req: Request, res: Response) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "username must be 3-32 chars; password at least 6" });
    return;
  }
  const { username, password } = parsed.data;
  try {
    const uid = createUser(username, bcrypt.hashSync(password, 10));
    const user: AuthUser = { uid, username };
    issueCookie(res, user);
    res.json({ username });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    if (e.code?.includes("CONSTRAINT") || /UNIQUE/i.test(e.message ?? "")) {
      res.status(409).json({ error: "that username is taken" });
      return;
    }
    throw err;
  }
});

authRouter.post("/login", (req: Request, res: Response) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const user = getUserByUsername(parsed.data.username);
  if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
    res.status(401).json({ error: "invalid credentials" });
    return;
  }
  const authed: AuthUser = { uid: user.id, username: user.username };
  issueCookie(res, authed);
  res.json({ username: user.username });
});

authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req: Request, res: Response) => {
  res.json(req.user);
});
