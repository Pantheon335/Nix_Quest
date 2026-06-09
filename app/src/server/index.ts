import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createServer } from "node:http";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { db, migrate } from "./db.js";
import { loadQuest } from "./quest.js";
import { authRouter, authFromCookie } from "./auth.js";
import { makeSoloRouter, leaderboardHandler } from "./routes.solo.js";
import { makeTeamRouter } from "./routes.team.js";
import { makeAdminRouter } from "./routes.admin.js";
import { makeSockets } from "./sockets.js";

const PORT = Number(process.env.PORT ?? 3000);
const QUEST_CONFIG = resolve(process.env.QUEST_CONFIG ?? "../quest/quest.yaml");

// Boot: migrations first, then load the hashed quest into memory.
migrate();
const quest = loadQuest(QUEST_CONFIG);
console.log(`Loaded quest "${quest.title}" with ${quest.stages.length} stage(s).`);

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(authFromCookie);

const httpServer = createServer(app);
const io = makeSockets(httpServer, quest);

// Throttle code guessing on both modes.
const submitLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/solo/submit", submitLimiter);
app.use("/api/team/submit", submitLimiter);

app.use("/api/auth", authRouter);
app.use("/api/solo", makeSoloRouter(quest, io));
app.use("/api/team", makeTeamRouter(quest, io));
app.use("/api/admin", makeAdminRouter(quest, io));
app.get("/api/leaderboard", leaderboardHandler);

app.get("/healthz", (_req, res) => {
  const team = db.prepare(`SELECT current_stage FROM team_state WHERE id = 1`).get() as
    | { current_stage: number }
    | undefined;
  res.json({
    status: "ok",
    quest: quest.title,
    stages: quest.stages.length,
    teamStage: team?.current_stage ?? 0,
  });
});

// Serve the built React client (production). In dev, Vite serves it on :5173.
const clientDir = resolve(dirname(fileURLToPath(import.meta.url)), "../client");
if (existsSync(clientDir)) {
  app.use(express.static(clientDir));
  app.use((req, res, next) => {
    if (req.method === "GET" && !req.path.startsWith("/api")) {
      res.sendFile(resolve(clientDir, "index.html"));
      return;
    }
    next();
  });
}

httpServer.listen(PORT, () => {
  console.log(`Office Quest listening on :${PORT}`);
});
