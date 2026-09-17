import { useEffect, useState } from "react";
import { api } from "../api";
import type { DeviceType, EvaluationSummary } from "../types";
import { ErrorNote, Spinner } from "../components/ui";

type Health = Awaited<ReturnType<typeof api.health>>;
const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

export default function Settings() {
  const [health, setHealth] = useState<Health | null>(null);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [evaluation, setEvaluation] = useState<{ hybrid: EvaluationSummary | null; llm: EvaluationSummary | null } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.health(), api.deviceTypes(), api.evaluation().catch(() => ({ hybrid: null, llm: null }))])
      .then(([h, d, e]) => {
        setHealth(h);
        setDevices(d);
        setEvaluation(e);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!health) return <Spinner label="Loading settings…" />;

  const llm = health.engine !== "fallback";
  const hybrid = health.retrieval.mode === "hybrid";
  const active = llm ? evaluation?.llm : evaluation?.hybrid;
  const hybridEval = evaluation?.hybrid;

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
        <h2 className="text-sm font-semibold">Measured performance of the active matcher</h2>
        <p className="mt-1 text-xs text-ink-500">
          Held-out figures from <span className="font-mono">npm run eval</span> (annotated evaluation set, clause-level
          60/40 split, nothing tuned on held-out). These are the same numbers the README quotes.
        </p>

        {!active ? (
          <div className="mt-4 rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 text-xs text-ink-600">
            No evaluation report found for this matcher. Run <span className="font-mono">npm run eval</span>
            {llm ? <> <span className="font-mono">-- --matcher=llm --live</span></> : null} and redeploy.
          </div>
        ) : (
          <>
            {active.coverage && active.coverage.missing > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <strong>Pipeline check, not a model evaluation.</strong> Only {active.coverage.answered} of{" "}
                {active.coverage.total} held-out passages have a recorded transcript
                {active.matcher === "llm-replay" ? " (hand-written, not produced by a model)" : ""}. The model has not been run
                on this data. The figures below cover only those {active.coverage.answered} passages.
              </div>
            )}
            {active.floorMet === false && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-900">
                <strong>Calibration target not met.</strong> No threshold configuration reached the{" "}
                {pct(active.precisionFloor ?? 0)} non-compliance precision floor. Thresholds were chosen by the fallback
                rule ({active.fallbackRule}). Treat offline PASS verdicts as "expected particulars present", not as
                verified compliance.
              </div>
            )}
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Held-out passages" value={String(active.heldOut.n)} />
              <Stat label="3-class accuracy" value={pct(active.heldOut.accuracy)} />
              <Stat
                label="Non-compliance recall"
                value={pct(active.heldOut.nonCompliance.recall)}
                hint={`${active.heldOut.nonCompliance.falseNegatives} missed`}
                tone={active.heldOut.nonCompliance.recall >= 0.8 ? "good" : "bad"}
              />
              <Stat
                label="Non-compliance precision"
                value={pct(active.heldOut.nonCompliance.precision)}
                hint={`${active.heldOut.nonCompliance.falsePositives} false alarms`}
                tone={active.heldOut.nonCompliance.precision >= (active.precisionFloor ?? 0.8) ? "good" : "bad"}
              />
            </dl>
            <div className="mt-4 overflow-hidden rounded-lg border border-ink-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-ink-50 uppercase tracking-wide text-ink-500">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Passage type</th>
                    <th className="px-3 py-2 font-semibold">n</th>
                    <th className="px-3 py-2 font-semibold">Correct</th>
                    <th className="px-3 py-2 font-semibold">Called PASS</th>
                    <th className="px-3 py-2 font-semibold">What it means</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {(
                    [
                      ["SATISFIED_LITERAL", "Satisfied, clause's own wording", "Recognises expected vocabulary"],
                      ["SATISFIED_PARAPHRASE", "Satisfied, different wording", "Recall on paraphrase"],
                      ["NOT_SATISFIED_DISTRACTOR", "On-topic but not satisfied", "Catches substantive gaps"],
                    ] as const
                  ).map(([key, label, meaning]) => {
                    const row = active.heldOut.byRelationship[key];
                    if (!row) return null;
                    return (
                      <tr key={key}>
                        <td className="px-3 py-2 font-medium">{label}</td>
                        <td className="px-3 py-2">{row.n}</td>
                        <td className={`px-3 py-2 font-semibold ${row.accuracy >= 0.8 ? "text-emerald-700" : row.accuracy >= 0.5 ? "text-amber-700" : "text-rose-700"}`}>
                          {pct(row.accuracy)}
                        </td>
                        <td className="px-3 py-2">
                          {row.predictedPass}/{row.n}
                          {key === "NOT_SATISFIED_DISTRACTOR" && row.predictedPass > 0 ? (
                            <span className="ml-1 text-rose-700">← false passes</span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-ink-500">{meaning}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {hybridEval?.thresholds && !llm && (
              <p className="mt-3 font-mono text-[11px] text-ink-500">
                thresholds: covPass {hybridEval.thresholds.covPass} · tauPass {hybridEval.thresholds.tauPass} · tauSoften{" "}
                {hybridEval.thresholds.tauSoften} · evaluated {new Date(active.generatedAt).toLocaleDateString("en-IN")}
              </p>
            )}
          </>
        )}
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

function Stat({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "good" | "bad" }) {
  const colour = tone === "good" ? "text-emerald-700" : tone === "bad" ? "text-rose-700" : "text-ink-900";
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={`mt-1 text-2xl font-bold ${colour}`}>{value}</dd>
      {hint && <dd className="text-[11px] text-ink-500">{hint}</dd>}
    </div>
  );
}
