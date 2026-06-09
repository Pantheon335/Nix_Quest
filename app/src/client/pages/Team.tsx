import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { socket } from "../lib/socket";
import { ProgressMeter, HintCard, Banner } from "../components";

interface FeedEntry {
  id: number;
  stage_order: number;
  display_name: string | null;
  solved_at: string;
}
interface TeamState {
  stage: number;
  hint: string | null;
  completed: boolean;
  completedBy: string | null;
  totalStages: number;
  feed: FeedEntry[];
}

export default function Team() {
  const [state, setState] = useState<TeamState | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    api.get<TeamState>("/api/team/state").then((r) => setState(r.data));

    const onState = (payload: TeamState) => setState(payload);
    const onSolved = (e: {
      stageOrder: number;
      displayName: string | null;
      nextHint: string | null;
      completed: boolean;
      solvedAt: string;
    }) => {
      const key = `${e.stageOrder}-${e.solvedAt}`;
      if (seen.current.has(key)) return;
      seen.current.add(key);
      setState((prev) =>
        prev
          ? {
              ...prev,
              stage: e.stageOrder,
              hint: e.nextHint,
              completed: e.completed,
              completedBy: e.completed ? e.displayName : prev.completedBy,
              feed: [
                {
                  id: Date.now(),
                  stage_order: e.stageOrder,
                  display_name: e.displayName,
                  solved_at: e.solvedAt,
                },
                ...prev.feed,
              ].slice(0, 25),
            }
          : prev
      );
    };

    socket.on("team:state", onState);
    socket.on("team:solved", onSolved);
    return () => {
      socket.off("team:state", onState);
      socket.off("team:solved", onSolved);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post<{ ok: boolean; reveal?: string; message?: string }>(
        "/api/team/submit",
        { code, displayName: name.trim() || undefined }
      );
      if (r.data.ok) {
        setMsg({ tone: "success", text: r.data.reveal ?? "Correct!" });
        setCode("");
      } else {
        setMsg({ tone: "error", text: r.data.message ?? "That code isn't right." });
      }
    } catch {
      setMsg({ tone: "error", text: "Something went wrong. Try again." });
    } finally {
      setBusy(false);
    }
  }

  if (!state) return <Loading />;

  return (
    <div className="space-y-6">
      <section className="panel animate-fade-up p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="label">Team mode · everyone hunts together</div>
            <h1 className="mt-1 font-display text-3xl font-semibold">The office is the map.</h1>
          </div>
        </div>
        <div className="mt-5">
          <ProgressMeter stage={state.stage} total={state.totalStages} />
        </div>
      </section>

      {state.completed ? (
        <Banner tone="success">
          🎉 The hunt is complete{state.completedBy ? ` — sealed by ${state.completedBy}` : ""}!
        </Banner>
      ) : (
        state.hint && <HintCard hint={state.hint} />
      )}

      {!state.completed && (
        <form onSubmit={submit} className="panel animate-fade-up space-y-3 p-6">
          <div className="label">Found a clue? Enter its code.</div>
          <input
            className="code-field text-lg"
            placeholder="e.g. BLUE-FALCON"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="field sm:flex-1"
              placeholder="Your name (optional, shown in the feed)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
            />
            <button className="btn-primary sm:w-40" disabled={busy || !code.trim()}>
              {busy ? "Checking…" : "Unlock"}
            </button>
          </div>
          {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
        </form>
      )}

      <section className="panel p-6">
        <div className="label mb-4">Live feed</div>
        {state.feed.length === 0 ? (
          <p className="text-sm text-muted">No codes cracked yet. Be the first.</p>
        ) : (
          <ul className="space-y-2">
            {state.feed.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded-lg border border-white/5 bg-ink/40 px-4 py-2.5 text-sm"
              >
                <span>
                  <span className="font-semibold text-amber">
                    {f.display_name || "Someone"}
                  </span>{" "}
                  cracked stage <span className="font-mono">{f.stage_order}</span>
                </span>
                <span className="font-mono text-xs text-muted">
                  {new Date(f.solved_at).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Loading() {
  return <div className="panel animate-pulse p-10 text-center text-muted">Loading the map…</div>;
}
