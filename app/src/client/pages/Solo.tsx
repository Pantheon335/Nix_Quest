import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { formatDuration } from "../lib/format";
import { ProgressMeter, HintCard, Banner } from "../components";

interface SoloState {
  started: boolean;
  stage?: number;
  hint?: string | null;
  hintImage?: string | null;
  completed?: boolean;
  startedAt?: string;
  completedAt?: string | null;
  totalStages: number;
}

export default function Solo() {
  const [me, setMe] = useState<string | null | undefined>(undefined); // undefined = loading
  const [run, setRun] = useState<SoloState | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get<{ username: string }>("/api/auth/me");
        setMe(r.data.username);
        await refreshRun();
      } catch {
        setMe(null);
      }
    })();
  }, []);

  async function refreshRun() {
    const r = await api.get<SoloState>("/api/solo/state");
    setRun(r.data);
  }

  if (me === undefined) {
    return <div className="panel animate-pulse p-10 text-center text-muted">Checking…</div>;
  }
  if (me === null) {
    return <AuthForms onAuthed={async (u) => { setMe(u); await refreshRun(); }} />;
  }
  return (
    <Cabinet
      username={me}
      run={run}
      refresh={refreshRun}
      onLogout={async () => {
        await api.post("/api/auth/logout");
        setMe(null);
        setRun(null);
      }}
    />
  );
}

function AuthForms({ onAuthed }: { onAuthed: (username: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api.post<{ username: string }>(`/api/auth/${mode}`, { username, password });
      onAuthed(r.data.username);
    } catch (e: any) {
      setErr(e?.message ?? "Failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="panel animate-fade-up p-7">
        <div className="label">Solo mode · race the clock</div>
        <h1 className="mt-1 font-display text-3xl font-semibold">
          {mode === "login" ? "Welcome back" : "Join the race"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your progress and time are tracked privately and ranked on the leaderboard.
        </p>
        <form onSubmit={submit} className="mt-5 space-y-3">
          <input
            className="field"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
          />
          <input
            className="field"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
          {err && <Banner tone="error">{err}</Banner>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? "…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <button
          className="mt-4 text-sm text-muted hover:text-amber"
          onClick={() => {
            setErr(null);
            setMode(mode === "login" ? "register" : "login");
          }}
        >
          {mode === "login" ? "No account? Register" : "Have an account? Log in"}
        </button>
      </div>
    </div>
  );
}

function Cabinet({
  username,
  run,
  refresh,
  onLogout,
}: {
  username: string;
  run: SoloState | null;
  refresh: () => Promise<void>;
  onLogout: () => void;
}) {
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [nowTs, setNowTs] = useState(Date.now());

  // Tick the live timer while a run is active.
  useEffect(() => {
    if (!run?.started || run.completed) return;
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, [run?.started, run?.completed]);

  async function start() {
    setBusy(true);
    try {
      await api.post("/api/solo/start");
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const r = await api.post<{ ok: boolean; reveal?: string; message?: string }>(
        "/api/solo/submit",
        { code }
      );
      if (r.data.ok) {
        setMsg({ tone: "success", text: r.data.reveal ?? "Correct!" });
        setCode("");
      } else {
        setMsg({ tone: "error", text: r.data.message ?? "That code isn't right." });
      }
      await refresh();
    } catch {
      setMsg({ tone: "error", text: "Something went wrong." });
    } finally {
      setBusy(false);
    }
  }

  const elapsed =
    run?.startedAt != null
      ? (run.completed && run.completedAt ? Date.parse(run.completedAt) : nowTs) -
        Date.parse(run.startedAt)
      : 0;

  return (
    <div className="space-y-6">
      <section className="panel animate-fade-up p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="label">Solo cabinet</div>
            <h1 className="mt-1 truncate font-display text-2xl font-semibold sm:text-3xl">
              {username}
            </h1>
          </div>
          <button className="btn-ghost shrink-0" onClick={onLogout}>
            Log out
          </button>
        </div>
        <div className="mt-4 flex items-baseline justify-between border-t border-white/10 pt-4">
          <span className="label">Your time</span>
          <span className="font-mono text-3xl text-amber tabular-nums">
            {formatDuration(elapsed)}
          </span>
        </div>
      </section>

      {!run?.started ? (
        <div className="panel animate-fade-up p-7 text-center">
          <p className="font-display text-2xl">Ready when you are.</p>
          <p className="mt-2 text-sm text-muted">The timer starts the moment you begin.</p>
          <button className="btn-primary mt-5 animate-pulse-glow" onClick={start} disabled={busy}>
            Start my run
          </button>
        </div>
      ) : (
        <>
          <ProgressMeter stage={run.stage ?? 0} total={run.totalStages} />
          {run.completed ? (
            <Banner tone="success">
              🏁 Finished in {formatDuration(elapsed)}. See where you landed on the{" "}
              <Link to="/leaderboard" className="underline">
                leaderboard
              </Link>
              .
            </Banner>
          ) : (
            <>
              {(run.hint || run.hintImage) && (
                <HintCard hint={run.hint ?? ""} image={run.hintImage} />
              )}
              <form onSubmit={submit} className="panel animate-fade-up space-y-3 p-5 sm:p-6">
                <div className="label">Enter the code you found</div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    className="code-field text-lg sm:flex-1"
                    placeholder="e.g. BLUE-FALCON"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button className="btn-primary sm:w-40" disabled={busy || !code.trim()}>
                    {busy ? "Checking…" : "Unlock"}
                  </button>
                </div>
                {msg && <Banner tone={msg.tone}>{msg.text}</Banner>}
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
}
