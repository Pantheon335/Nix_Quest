import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", label: "The Hunt", end: true },
  { to: "/solo", label: "My Run", end: false },
  { to: "/leaderboard", label: "Leaderboard", end: false },
];

export default function App() {
  return (
    <div className="relative z-10 mx-auto flex min-h-full max-w-4xl flex-col px-5 pb-16">
      <header className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-amber/50 text-amber">
            <Compass />
          </span>
          <div className="leading-tight">
            <div className="font-display text-xl font-semibold tracking-wide">Office Quest</div>
            <div className="label">find · decode · advance</div>
          </div>
        </div>
        <nav className="flex w-full gap-1 rounded-2xl border border-white/10 bg-panel/50 p-1 backdrop-blur-sm sm:w-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex-1 whitespace-nowrap rounded-xl px-3 py-2 text-center text-xs font-semibold transition-colors sm:flex-none sm:px-4 sm:text-sm ${
                  isActive ? "bg-amber text-ink" : "text-muted hover:text-parchment"
                }`
              }
            >
              {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

function Compass() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 8.5 13 13l-4.5 2.5L11 11l4.5-2.5Z" fill="currentColor" />
    </svg>
  );
}
