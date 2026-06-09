import { db } from "./db.js";

export interface UserRow {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}
export interface SoloRunRow {
  user_id: number;
  started_at: string;
  current_stage: number;
  completed_at: string | null;
}
export interface TeamStateRow {
  id: number;
  current_stage: number;
  started_at: string | null;
  completed_at: string | null;
  completed_by: string | null;
}
export interface TeamFeedRow {
  id: number;
  stage_order: number;
  display_name: string | null;
  solved_at: string;
}

const now = (): string => new Date().toISOString();

// ---- users ----
export function createUser(username: string, passwordHash: string): number {
  const info = db
    .prepare(`INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)`)
    .run(username, passwordHash, now());
  return Number(info.lastInsertRowid);
}

export function getUserByUsername(username: string): UserRow | undefined {
  return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) as
    | UserRow
    | undefined;
}

// ---- solo ----
export function startSoloRun(userId: number): SoloRunRow {
  db.prepare(
    `INSERT INTO solo_runs (user_id, started_at, current_stage)
     VALUES (?, ?, 0)
     ON CONFLICT(user_id) DO NOTHING`
  ).run(userId, now());
  return db.prepare(`SELECT * FROM solo_runs WHERE user_id = ?`).get(userId) as SoloRunRow;
}

export function getSoloRun(userId: number): SoloRunRow | undefined {
  return db.prepare(`SELECT * FROM solo_runs WHERE user_id = ?`).get(userId) as
    | SoloRunRow
    | undefined;
}

export function advanceSolo(userId: number, newStage: number, completedAt: string | null): void {
  db.prepare(`UPDATE solo_runs SET current_stage = ?, completed_at = ? WHERE user_id = ?`).run(
    newStage,
    completedAt,
    userId
  );
}

export function recordSoloSolve(userId: number, stageOrder: number): void {
  db.prepare(
    `INSERT OR IGNORE INTO solo_solves (user_id, stage_order, solved_at) VALUES (?, ?, ?)`
  ).run(userId, stageOrder, now());
}

export interface LeaderRow {
  username: string;
  stage: number;
  startedAt: string;
  completedAt: string | null;
  elapsedMs: number | null;
  status: "done" | "in_progress";
}

export function getLeaderboard(): LeaderRow[] {
  const rows = db
    .prepare(
      `SELECT u.username AS username,
              r.current_stage AS stage,
              r.started_at AS startedAt,
              r.completed_at AS completedAt
       FROM solo_runs r JOIN users u ON u.id = r.user_id`
    )
    .all() as { username: string; stage: number; startedAt: string; completedAt: string | null }[];

  const mapped: LeaderRow[] = rows.map((r) => ({
    username: r.username,
    stage: r.stage,
    startedAt: r.startedAt,
    completedAt: r.completedAt,
    elapsedMs: r.completedAt ? Date.parse(r.completedAt) - Date.parse(r.startedAt) : null,
    status: r.completedAt ? "done" : "in_progress",
  }));

  // Finishers first (fastest time wins); then in-progress players, furthest along first.
  mapped.sort((a, b) => {
    if (a.status !== b.status) return a.status === "done" ? -1 : 1;
    if (a.status === "done") return (a.elapsedMs ?? 0) - (b.elapsedMs ?? 0);
    return b.stage - a.stage;
  });
  return mapped;
}

// ---- team ----
export function getTeamState(): TeamStateRow {
  return db.prepare(`SELECT * FROM team_state WHERE id = 1`).get() as TeamStateRow;
}

export function startTeamIfNeeded(ts: string): void {
  db.prepare(`UPDATE team_state SET started_at = ? WHERE id = 1 AND started_at IS NULL`).run(ts);
}

export function advanceTeam(
  newStage: number,
  completedAt: string | null,
  completedBy: string | null
): void {
  db.prepare(
    `UPDATE team_state SET current_stage = ?, completed_at = ?, completed_by = ? WHERE id = 1`
  ).run(newStage, completedAt, completedBy);
}

export function addTeamFeed(stageOrder: number, displayName: string | null): TeamFeedRow {
  const info = db
    .prepare(`INSERT INTO team_feed (stage_order, display_name, solved_at) VALUES (?, ?, ?)`)
    .run(stageOrder, displayName, now());
  return db.prepare(`SELECT * FROM team_feed WHERE id = ?`).get(Number(info.lastInsertRowid)) as TeamFeedRow;
}

export function getTeamFeed(limit: number): TeamFeedRow[] {
  return db.prepare(`SELECT * FROM team_feed ORDER BY id DESC LIMIT ?`).all(limit) as TeamFeedRow[];
}
