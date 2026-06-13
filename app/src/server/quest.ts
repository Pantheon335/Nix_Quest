import { readFileSync } from "node:fs";
import { parse as parseYaml } from "yaml";
import bcrypt from "bcryptjs";
import { z } from "zod";

/**
 * Normalize a code before hashing or comparing.
 * Strips everything that isn't a letter or digit and upper-cases, so casing
 * and separators never cause a false miss: "BLUE-FALCON", "blue falcon",
 * "Blue_Falcon" and "bluefalcon" all normalize to "BLUEFALCON".
 */
export function normalizeCode(input: string): string {
  return input.normalize("NFKC").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

// ---- Hashed config (committed quest.yaml) ----
const hashedStageSchema = z.object({
  code_hash: z.string().min(1),
  reveal: z.string().min(1),
  image: z.string().min(1).optional(),
  final: z.boolean().optional().default(false),
});

const hashedQuestSchema = z.object({
  title: z.string().min(1),
  intro_hint: z.string().min(1),
  intro_image: z.string().min(1).optional(),
  stages: z.array(hashedStageSchema).min(1),
});

// ---- Plaintext config (local quest.plain.yaml, used only by the hash tool) ----
export const plainStageSchema = z.object({
  code: z.string().min(1),
  reveal: z.string().min(1),
  image: z.string().min(1).optional(),
  final: z.boolean().optional().default(false),
});

export const plainQuestSchema = z.object({
  title: z.string().min(1),
  intro_hint: z.string().min(1),
  intro_image: z.string().min(1).optional(),
  stages: z.array(plainStageSchema).min(1),
});

export type PlainQuest = z.infer<typeof plainQuestSchema>;

export interface Stage {
  codeHash: string;
  reveal: string;
  image: string | null;
  final: boolean;
}

export interface Quest {
  title: string;
  introHint: string;
  introImage: string | null;
  stages: Stage[];
}

/**
 * Turn a config image reference into a URL the browser can load.
 * Absolute http(s) URLs pass through; anything else is served from the quest
 * `assets/` folder via the /quest-assets route. So `clue1.jpg`, `assets/clue1.jpg`,
 * and `https://…/clue1.jpg` all work.
 */
export function publicImage(img?: string | null): string | null {
  if (!img) return null;
  if (/^https?:\/\//i.test(img)) return img;
  const clean = img.replace(/^\/?(?:quest-assets\/|assets\/)?/i, "");
  return "/quest-assets/" + clean;
}

/** Load and validate the committed, hashed quest config. */
export function loadQuest(path: string): Quest {
  const raw = parseYaml(readFileSync(path, "utf8"));
  const parsed = hashedQuestSchema.parse(raw);

  const finals = parsed.stages.filter((s) => s.final).length;
  if (finals !== 1) {
    throw new Error(`quest config must have exactly one stage marked final (found ${finals})`);
  }
  if (!parsed.stages[parsed.stages.length - 1].final) {
    throw new Error("the final stage must be the last stage in the list");
  }

  return {
    title: parsed.title,
    introHint: parsed.intro_hint,
    introImage: publicImage(parsed.intro_image),
    stages: parsed.stages.map((s) => ({
      codeHash: s.code_hash,
      reveal: s.reveal,
      image: publicImage(s.image),
      final: s.final,
    })),
  };
}

/** Does the submitted code match the code for the given stage index (0-based)? */
export function verifyCode(quest: Quest, stageIndex: number, submitted: string): boolean {
  const stage = quest.stages[stageIndex];
  if (!stage) return false;
  return bcrypt.compareSync(normalizeCode(submitted), stage.codeHash);
}

/** The hint a player should see when they are about to solve `stageIndex`. */
export function hintForStage(quest: Quest, stageIndex: number): string {
  if (stageIndex <= 0) return quest.introHint;
  return quest.stages[stageIndex - 1].reveal;
}

/** The image (if any) accompanying the current clue at `stageIndex`. */
export function imageForStage(quest: Quest, stageIndex: number): string | null {
  if (stageIndex <= 0) return quest.introImage;
  return quest.stages[stageIndex - 1].image;
}

export function isComplete(quest: Quest, stageIndex: number): boolean {
  return stageIndex >= quest.stages.length;
}
