import { useEffect, useState } from "react";
import { api } from "../api";
import type { DeviceType } from "../types";
import { ErrorNote, Spinner } from "../components/ui";

type Health = Awaited<ReturnType<typeof api.health>>;

export default function Settings() {
  const [health, setHealth] = useState<Health | null>(null);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.health(), api.deviceTypes()])
      .then(([h, d]) => {
        setHealth(h);
        setDevices(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!health) return <Spinner label="Loading settings…" />;

  const llm = health.engine !== "fallback";
  const hybrid = health.retrieval.mode === "hybrid";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Local configuration for this installation. Everything here is read from the workspace <code>.env</code>.
        </p>
      </header>

      <section className="card p-6">
        <h2 className="text-sm font-semibold">Screening engine</h2>
        <div
          className={`mt-3 rounded-lg border px-4 py-3 ${
            llm ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className={`text-sm font-semibold ${llm ? "text-emerald-800" : "text-amber-900"}`}>
            {llm
              ? "Grounded LLM verification is active"
              : hybrid
                ? "Hybrid BM25 + sentence-embedding matcher (no API key configured)"
                : "BM25 + controlled vocabulary only — embeddings unavailable"}
          </div>
          <p className={`mt-1 text-xs leading-relaxed ${llm ? "text-emerald-800" : "text-amber-900"}`}>
            {llm ? (
              <>
                Each clause is verified by a separate grounded call to{" "}
                <span className="font-mono">{health.model}</span>, returning a strict-JSON verdict with an evidence
                quote taken from the dossier. If a call fails, that clause falls back to the hybrid matcher and the
                finding is labelled accordingly.
              </>
            ) : hybrid ? (
              <>
                Clauses are screened with no network access by fusing <strong>BM25</strong> (k1 = 1.5, b = 0.75, query
                expanded with each clause&rsquo;s controlled vocabulary) with <strong>sentence-embedding</strong> cosine
                similarity from a local <span className="font-mono">{health.retrieval.embeddingModel}</span> model:
                score = {health.retrieval.alpha} × semantic + {(1 - health.retrieval.alpha).toFixed(2)} × BM25.
                Keyword-group coverage decides PASS; retrieval can soften a reject to a gap and supply context, but never
                produces a pass on its own. To enable LLM verification, set{" "}
                <span className="font-mono">ANTHROPIC_API_KEY</span> and restart.
              </>
            ) : (
              <>
                The sentence-embedding model could not be loaded
                {health.retrieval.modelError ? ` (${health.retrieval.modelError})` : ""}, so retrieval is running on{" "}
                <strong>BM25 + controlled vocabulary alone</strong>. Verdicts are still produced, but paraphrased
                evidence is more likely to be missed. Run <span className="font-mono">npm run db:reset</span> with
                network access to download the model (~23 MB, cached afterwards).
              </>
            )}
          </p>
        </div>

        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="label">LLM model</dt>
            <dd className="mt-1 font-mono text-xs">{health.model ?? "— (not configured)"}</dd>
          </div>
          <div>
            <dt className="label">Retrieval mode</dt>
            <dd className="mt-1 text-xs">
              <span className={`font-semibold ${hybrid ? "text-emerald-700" : "text-amber-700"}`}>
                {hybrid ? "hybrid" : "lexical only"}
              </span>{" "}
              <span className="text-ink-500">
                · {health.retrieval.embeddedClauses}/{health.retrieval.totalClauses} clauses embedded
              </span>
            </dd>
          </div>
          <div>
            <dt className="label">Fusion weight α</dt>
            <dd className="mt-1 font-mono text-xs">{health.retrieval.alpha}</dd>
          </div>
          <div>
            <dt className="label">Verdict vocabulary</dt>
            <dd className="mt-1 text-xs text-ink-600">PASS · MINOR IMPROVEMENT · REJECT</dd>
          </div>
        </dl>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold">Rule library</h2>
        <p className="mt-1 text-xs text-ink-500">
          Device coverage currently loaded in the database. Re-seed with{" "}
          <span className="font-mono">npm run db:reset</span> from the project root.
        </p>
        <div className="mt-4 overflow-hidden rounded-lg border border-ink-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-2.5 font-semibold">Device</th>
                <th className="px-4 py-2.5 font-semibold">Class</th>
                <th className="px-4 py-2.5 font-semibold">Particular standard</th>
                <th className="px-4 py-2.5 font-semibold">Clauses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {devices.map((device) => (
                <tr key={device.id}>
                  <td className="px-4 py-2.5 font-medium">{device.name}</td>
                  <td className="px-4 py-2.5">{device.riskClass}</td>
                  <td className="px-4 py-2.5 font-mono text-xs">{device.particularStandard}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-500">
                    {device.commonCoreClauseCount} core + {device.specificClauseCount} specific ={" "}
                    <strong className="text-ink-900">{device.totalClauseCount}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-sm font-semibold">Session</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink-500">
          This prototype runs as a single local reviewer with no login, because it is designed to run on the
          reviewer&rsquo;s own machine. The API already carries a reviewer identity on every request
          (<span className="font-mono">req.reviewer</span>), so adding real authentication means replacing one
          middleware in <span className="font-mono">apps/api/src/index.ts</span> rather than touching the routes.
        </p>
      </section>

      <section className="card border-amber-200 bg-amber-50 p-6">
        <h2 className="text-sm font-semibold text-amber-900">Scope of this tool</h2>
        <p className="mt-1 text-xs leading-relaxed text-amber-900">
          MedDevAudit-IN is a course prototype that screens dossiers against a curated subset of MDR-2017 for five
          device categories. Its output is a review aid, not a regulatory determination, and every finding is intended
          to be confirmed by a qualified reviewer before any decision is taken.
        </p>
      </section>
    </div>
  );
}
