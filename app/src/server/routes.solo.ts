import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { Server } from "socket.io";
import { requireAuth } from "./auth.js";
import { type Quest, hintForStage, imageForStage, verifyCode } from "./quest.js";
import {
  getSoloRun,
  startSoloRun,
  advanceSolo,
  recordSoloSolve,
  getLeaderboard,
} from "./store.js";

const submitBody = z.object({ code: z.string().min(1).max(200) });

export function makeSoloRouter(quest: Quest, io: Server): Router {
  const r = Router();
  r.use(requireAuth);

  // Start (or resume) the player's run and reveal the first hint.
  r.post("/start", (req: Request, res: Response) => {
    const run = startSoloRun(req.user!.uid);
    res.json({
      stage: run.current_stage,
      hint: hintForStage(quest, run.current_stage),
      hintImage: imageForStage(quest, run.current_stage),
      startedAt: run.started_at,
      completedAt: run.completed_at,
      totalStages: quest.stages.length,
    });
  });

  // Current progress for the logged-in player.
  r.get("/state", (req: Request, res: Response) => {
    const run = getSoloRun(req.user!.uid);
    if (!run) {
      res.json({ started: false, totalStages: quest.stages.length });
      return;
    }
    const completed = run.completed_at != null;
    res.json({
      started: true,
      stage: run.current_stage,
      hint: completed ? null : hintForStage(quest, run.current_stage),
      hintImage: completed ? null : imageForStage(quest, run.current_stage),
      completed,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      totalStages: quest.stages.length,
    });
  });

  // Submit a code; advance on success.
  r.post("/submit", (req: Request, res: Response) => {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "code required" });
      return;
    }
    const run = getSoloRun(req.user!.uid);
    if (!run) {
      res.status(400).json({ error: "start the quest first" });
      return;
    }
    if (run.completed_at != null) {
      res.status(400).json({ error: "you already finished" });
      return;
    }

    const idx = run.current_stage;
    if (!verifyCode(quest, idx, parsed.data.code)) {
      res.status(422).json({ ok: false, message: "That code isn't right — keep looking." });
      return;
    }

    const newStage = idx + 1;
    const completed = newStage >= quest.stages.length;
    const finishedAt = completed ? new Date().toISOString() : null;

    recordSoloSolve(req.user!.uid, newStage);
    advanceSolo(req.user!.uid, newStage, finishedAt);
    if (completed) io.emit("leaderboard:update");

    res.json({
      ok: true,
      stage: newStage,
      reveal: quest.stages[idx].reveal,
      completed,
      hint: completed ? null : hintForStage(quest, newStage),
      hintImage: completed ? null : imageForStage(quest, newStage),
    });
  });

  return r;
}

export function leaderboardHandler(_req: Request, res: Response): void {
  res.json(getLeaderboard());
}
