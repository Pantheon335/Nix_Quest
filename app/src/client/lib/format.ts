/** Format a millisecond duration as e.g. "2:05" or "1:03:09". */
export function formatDuration(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) return "0:00";
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
