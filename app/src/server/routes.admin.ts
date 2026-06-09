import { Router, type Request, type Response } from "express";
import type { Server } from "socket.io";
import { timingSafeEqual } from "node:crypto";
import { resetGame } from "./db.js";
import { type Quest } from "./quest.js";
import { teamStatePayload } from "./routes.team.js";

function safeEqual(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function makeAdminRouter(quest: Quest, io: Server): Router {
  const r = Router();
  const token = process.env.ADMIN_TOKEN;

  // POST /api/admin/reset  — header: x-admin-token: <token>
  r.post("/reset", (req: Request, res: Response) => {
    if (!token) {
      res.status(404).json({ error: "admin endpoints disabled (no ADMIN_TOKEN set)" });
      return;
    }
    const provided = req.get("x-admin-token") ?? (req.body?.token as string | undefined);
    if (!safeEqual(provided, token)) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    resetGame();
    // Push the fresh state to everyone watching.
    io.emit("team:state", teamStatePayload(quest));
    io.emit("leaderboard:update");
    res.json({ ok: true });
  });

  return r;
}
