import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { Server } from "socket.io";
import { type Quest, hintForStage, imageForStage, verifyCode } from "./quest.js";
import {
  getTeamState,
  startTeamIfNeeded,
  advanceTeam,
  addTeamFeed,
  getTeamFeed,
} from "./store.js";

/** Snapshot of team progress sent over REST and on socket connect. */
export function teamStatePayload(quest: Quest) {
  const s = getTeamState();
  const completed = s.completed_at != null;
  return {
    stage: s.current_stage,
    hint: completed ? null : hintForStage(quest, s.current_stage),
    hintImage: completed ? null : imageForStage(quest, s.current_stage),
    completed,
    startedAt: s.started_at,
    completedAt: s.completed_at,
    completedBy: s.completed_by,
    totalStages: quest.stages.length,
    feed: getTeamFeed(25),
  };
}

const submitBody = z.object({
  code: z.string().min(1).max(200),
  displayName: z.string().trim().max(40).optional(),
});

export function makeTeamRouter(quest: Quest, io: Server): Router {
  const r = Router();

  r.get("/state", (_req: Request, res: Response) => {
    res.json(teamStatePayload(quest));
  });

  r.post("/submit", (req: Request, res: Response) => {
    const parsed = submitBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "code required" });
      return;
    }
    const state = getTeamState();
    if (state.completed_at != null) {
      res.status(400).json({ error: "the quest is already complete" });
      return;
    }

    const idx = state.current_stage;
    if (!verifyCode(quest, idx, parsed.data.code)) {
      res.status(422).json({ ok: false, message: "That code isn't right — keep looking." });
      return;
    }

    const name = parsed.data.displayName?.length ? parsed.data.displayName : null;
    const newStage = idx + 1;
    const completed = newStage >= quest.stages.length;
    const ts = new Date().toISOString();

    startTeamIfNeeded(ts);
    advanceTeam(newStage, completed ? ts : null, completed ? name : null);
    const entry = addTeamFeed(newStage, name);

    // Push the update to everyone watching the main page.
    io.emit("team:solved", {
      stageOrder: newStage,
      displayName: name,
      reveal: quest.stages[idx].reveal,
      nextHint: completed ? null : hintForStage(quest, newStage),
      nextHintImage: completed ? null : imageForStage(quest, newStage),
      completed,
      solvedAt: entry.solved_at,
    });

    res.json({ ok: true, stage: newStage, reveal: quest.stages[idx].reveal, completed });
  });

  return r;
}
