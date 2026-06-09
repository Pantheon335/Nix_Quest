import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { formatDuration } from "../lib/format";

interface LeaderRow {
  username: string;
  stage: number;
  startedAt: string;
  completedAt: string | null;
  elapsedMs: number | null;
  status: "done" | "in_progress";
}

export default function Leaderboard() {
  const [rows, setRows] = useState<LeaderRow[] | null>(null);

  useEffect(() => {
    const load = () => api.get<LeaderRow[]>("/api/leaderboard").then((r) => setRows(r.data));
    load();
    socket.on("leaderboard:update", load);
    return () => {
      socket.off("leaderboard:update", load);
    };
  }, []);

  if (!rows) {
    return <div className="panel animate-pulse p-10 text-center text-muted">Tallying…</div>;
  }

  const finishers = rows.filter((r) => r.status === "done");
  const racing = rows.filter((r) => r.status === "in_progress");

  return (
    <div className="space-y-6">
      <section className="panel animate-fade-up p-6">
        <div className="label">Solo standings</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">Fastest to the finish</h1>
      </section>

      <section className="panel p-6">
        <div className="label mb-4">Finishers</div>
        {finishers.length === 0 ? (
          <p className="text-sm text-muted">No one's finished yet. The crown is up for grabs.</p>
        ) : (
          <ol className="space-y-2">
            {finishers.map((r, i) => (
              <li
                key={r.username}
                className="flex items-center gap-4 rounded-xl border border-white/5 bg-ink/40 px-4 py-3"
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold ${
                    i === 0 ? "bg-amber text-ink" : "border border-white/15 text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="flex-1 font-semibold">{r.username}</span>
                <span className="font-mono text-amber tabular-nums">
                  {formatDuration(r.elapsedMs ?? 0)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {racing.length > 0 && (
        <section className="panel p-6">
          <div className="label mb-4">Still on the trail</div>
          <ul className="space-y-2">
            {racing.map((r) => (
              <li
                key={r.username}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-ink/40 px-4 py-3 text-sm"
              >
                <span className="font-semibold">{r.username}</span>
                <span className="font-mono text-muted">stage {r.stage}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
