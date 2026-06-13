// A small pool of verbs so the live feed reads with variety instead of always
// "cracked". The verb is chosen deterministically from a stable seed (stage +
// timestamp) so it never flickers on re-render and reads the same for everyone.
const VERBS = [
  "cracked",
  "unlocked",
  "solved",
  "decoded",
  "busted open",
  "nailed",
  "conquered",
  "uncovered",
  "sniffed out",
  "figured out",
  "smashed",
  "unraveled",
  "pieced together",
  "tracked down",
];

export function feedVerb(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return VERBS[h % VERBS.length];
}
