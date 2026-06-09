import type { ReactNode } from "react";

export function ProgressMeter({ stage, total }: { stage: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((stage / total) * 100)) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="label">Progress</span>
        <span className="font-mono text-parchment">
          {stage} / {total}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-[width] duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function HintCard({ hint }: { hint: string }) {
  return (
    <div className="panel animate-fade-up p-6">
      <div className="label mb-2">Current clue</div>
      <p className="font-display text-2xl leading-snug text-parchment">{hint}</p>
    </div>
  );
}

export function Banner({
  tone,
  children,
}: {
  tone: "success" | "error" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "success"
      ? "border-teal/40 bg-teal/10 text-teal"
      : tone === "error"
        ? "border-danger/40 bg-danger/10 text-danger"
        : "border-amber/40 bg-amber/10 text-amberbright";
  return (
    <div className={`animate-fade-up rounded-xl border px-4 py-3 text-sm font-medium ${styles}`}>
      {children}
    </div>
  );
}
