import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DB_PATH ?? "./data/quest.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/** Create tables if they don't exist. Safe to run on every boot. */
export function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS solo_runs (
      user_id       INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      started_at    TEXT NOT NULL,
      current_stage INTEGER NOT NULL DEFAULT 0,
      completed_at  TEXT
    );

    CREATE TABLE IF NOT EXISTS solo_solves (
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      stage_order INTEGER NOT NULL,
      solved_at   TEXT NOT NULL,
      PRIMARY KEY (user_id, stage_order)
    );

    CREATE TABLE IF NOT EXISTS team_state (
      id            INTEGER PRIMARY KEY CHECK (id = 1),
      current_stage INTEGER NOT NULL DEFAULT 0,
      started_at    TEXT,
      completed_at  TEXT,
      completed_by  TEXT
    );

    CREATE TABLE IF NOT EXISTS team_feed (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      stage_order  INTEGER NOT NULL,
      display_name TEXT,
      solved_at    TEXT NOT NULL
    );
  `);

  // Ensure the single team_state row exists.
  db.prepare(
    `INSERT OR IGNORE INTO team_state (id, current_stage) VALUES (1, 0)`
  ).run();
}

/** Wipe all progress (users, runs, team state) so the quest can be re-run. */
export function resetGame(): void {
  db.exec(`
    DELETE FROM solo_solves;
    DELETE FROM solo_runs;
    DELETE FROM users;
    DELETE FROM team_feed;
    UPDATE team_state SET current_stage = 0, started_at = NULL,
                          completed_at = NULL, completed_by = NULL WHERE id = 1;
  `);
}
