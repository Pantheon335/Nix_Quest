/**
 * Turns the local plaintext quest file into the committed, hashed one.
 *
 *   npm run quest:hash                 # ../quest/quest.plain.yaml -> ../quest/quest.yaml
 *   npm run quest:hash in.yaml out.yaml
 *
 * The plaintext file holds codes in clear text and must stay gitignored.
 * The output file replaces each `code` with a bcrypt `code_hash`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import bcrypt from "bcryptjs";
import { plainQuestSchema, normalizeCode } from "./quest.js";

const BCRYPT_ROUNDS = 10;

const inPath = resolve(process.argv[2] ?? "../quest/quest.plain.yaml");
const outPath = resolve(process.argv[3] ?? "../quest/quest.yaml");

const plain = plainQuestSchema.parse(parseYaml(readFileSync(inPath, "utf8")));

const hashed = {
  title: plain.title,
  intro_hint: plain.intro_hint,
  stages: plain.stages.map((s) => ({
    code_hash: bcrypt.hashSync(normalizeCode(s.code), BCRYPT_ROUNDS),
    reveal: s.reveal,
    ...(s.final ? { final: true } : {}),
  })),
};

writeFileSync(outPath, stringifyYaml(hashed), "utf8");
console.log(`Hashed ${plain.stages.length} stage(s): ${inPath} -> ${outPath}`);
