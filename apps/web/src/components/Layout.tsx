import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "../api";

const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/new", label: "New Audit" },
  { to: "/history", label: "Audit History" },
  { to: "/rules", label: "Rule Library" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const [engine, setEngine] = useState<{ engine: string; model: string | null; retrieval: string } | null>(null);

  useEffect(() => {
    api
      .health()
      .then((h) => setEngine({ engine: h.engine, model: h.model, retrieval: h.retrieval.mode }))
      .catch(() => setEngine(null));
  }, []);

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-ink-950 px-4 py-6 text-ink-100 lg:flex">
        <div className="px-2">
          <div className="text-lg font-bold tracking-tight text-white">
            MedDev<span className="text-emerald-400">Audit</span>-IN
          </div>
          <div className="mt-1 text-[11px] leading-snug text-ink-400">
            Import-dossier compliance auditor
            <br />
            Medical Device Rules, 2017
          </div>
        </div>

        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? "bg-white/10 text-white" : "text-ink-300 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto rounded-lg bg-white/5 p-3 text-[11px] leading-relaxed text-ink-300">
          <div className="font-semibold text-ink-100">Screening engine</div>
          {engine ? (
            engine.engine === "fallback" ? (
              engine.retrieval === "hybrid" ? (
                <>BM25 + sentence embeddings (offline). Add an ANTHROPIC_API_KEY to enable LLM verification.</>
              ) : (
                <>
                  <span className="text-amber-300">BM25 only — embeddings unavailable.</span> See Settings.
                </>
              )
            ) : (
              <>
                Grounded LLM verification
                <br />
                <span className="font-mono text-[10px] text-emerald-300">{engine.model}</span>
              </>
            )
          ) : (
            <>Checking…</>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-4 border-b border-ink-200 bg-white px-6 py-3 lg:hidden">
          <div className="font-bold">MedDevAudit-IN</div>
          <nav className="flex gap-3 overflow-x-auto text-sm">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap ${isActive ? "font-semibold text-ink-900" : "text-ink-500"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-8 lg:px-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
