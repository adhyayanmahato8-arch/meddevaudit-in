import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import type { AuditDetail, Finding, Verdict, VerdictCounts } from "../types";
import {
  ErrorNote,
  Spinner,
  VERDICT_LABEL,
  VerdictBadge,
  VerdictBar,
  engineLabel,
  formatDate,
} from "../components/ui";

const FILTERS: { key: "ALL" | Verdict; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "REJECT", label: "Reject" },
  { key: "MINOR_IMPROVEMENT", label: "Minor improvement" },
  { key: "PASS", label: "Pass" },
];

export default function AuditReport() {
  const { id = "" } = useParams();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"ALL" | Verdict>("ALL");

  useEffect(() => {
    api
      .audit(id)
      .then(setAudit)
      .catch((e) => setError(e.message));
  }, [id]);

  const grouped = useMemo(() => {
    if (!audit) return [];
    const visible = audit.findings.filter((f) => filter === "ALL" || f.effectiveVerdict === filter);
    const map = new Map<string, Finding[]>();
    for (const finding of visible) {
      const list = map.get(finding.clause.category) ?? [];
      list.push(finding);
      map.set(finding.clause.category, list);
    }
    return [...map.entries()];
  }, [audit, filter]);

  if (error) return <ErrorNote message={error} />;
  if (!audit) return <Spinner label="Loading audit report…" />;

  function applyOverride(findingId: string, patch: { reviewerVerdict?: Verdict | null; reviewerComment?: string }) {
    return api.overrideFinding(id, findingId, patch).then((response) => {
      setAudit((current) =>
        current
          ? {
              ...current,
              overallResult: response.overallResult,
              counts: response.counts as VerdictCounts,
              findings: current.findings.map((finding) =>
                finding.id === findingId
                  ? {
                      ...finding,
                      reviewerVerdict: response.finding.reviewerVerdict,
                      reviewerComment: response.finding.reviewerComment,
                      effectiveVerdict: (response.finding.reviewerVerdict ?? finding.aiVerdict) as Verdict,
                    }
                  : finding,
              ),
            }
          : current,
      );
    });
  }

  const overriddenCount = audit.findings.filter((f) => f.reviewerVerdict).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link to="/history" className="text-ink-500 hover:text-ink-900 hover:underline">
          Audit history
        </Link>
        <span className="text-ink-300">/</span>
        <span className="font-medium">Report</span>
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-6 p-6">
          <div className="min-w-0">
            <div className="label">Overall result</div>
            <div className="mt-2">
              <VerdictBadge verdict={audit.overallResult} size="lg" />
            </div>
            <h1 className="mt-4 text-xl font-bold leading-tight">{audit.dossierFilename}</h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              <span>
                {audit.deviceType.name} · Class {audit.deviceType.riskClass}
              </span>
              <span className="font-mono">{audit.deviceType.particularStandard}</span>
              <span>{formatDate(audit.createdAt)}</span>
              <span>{engineLabel(audit.engine)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <a className="btn-ghost" href={api.exportUrl(audit.id)} target="_blank" rel="noreferrer">
              Export PDF
            </a>
            <Link to="/new" className="btn-primary">
              New audit
            </Link>
          </div>
        </div>

        <div className="border-t border-ink-100 px-6 py-4">
          <VerdictBar counts={audit.counts} />
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-600">
            <span>
              <strong className="text-emerald-700">{audit.counts.PASS}</strong> pass
            </span>
            <span>
              <strong className="text-amber-700">{audit.counts.MINOR_IMPROVEMENT}</strong> minor improvement required
            </span>
            <span>
              <strong className="text-rose-700">{audit.counts.REJECT}</strong> reject
            </span>
            <span className="text-ink-500">{audit.findings.length} clauses screened</span>
            {overriddenCount > 0 && (
              <span className="text-ink-500">{overriddenCount} reviewer override{overriddenCount === 1 ? "" : "s"}</span>
            )}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-500">
            Result rule: <strong>Reject</strong> if any mandatory clause is rejected; <strong>minor improvement</strong>{" "}
            if any clause is incomplete and no mandatory clause is rejected; otherwise <strong>pass</strong>. A reviewer
            override always supersedes the AI verdict.
          </p>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => {
          const count =
            option.key === "ALL"
              ? audit.findings.length
              : audit.findings.filter((f) => f.effectiveVerdict === option.key).length;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setFilter(option.key)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                filter === option.key
                  ? "border-ink-900 bg-ink-900 text-white"
                  : "border-ink-200 bg-white text-ink-600 hover:border-ink-400"
              }`}
            >
              {option.label} · {count}
            </button>
          );
        })}
      </div>

      {grouped.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-500">
          No findings match this filter.
        </div>
      ) : (
        grouped.map(([category, findings]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">{category}</h2>
            {findings.map((finding) => (
              <FindingCard key={finding.id} finding={finding} onOverride={applyOverride} />
            ))}
          </section>
        ))
      )}
    </div>
  );
}

function FindingCard({
  finding,
  onOverride,
}: {
  finding: Finding;
  onOverride: (
    findingId: string,
    patch: { reviewerVerdict?: Verdict | null; reviewerComment?: string },
  ) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState(finding.reviewerComment ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    setComment(finding.reviewerComment ?? "");
  }, [finding.reviewerComment]);

  async function save(patch: { reviewerVerdict?: Verdict | null; reviewerComment?: string }) {
    setSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      await onOverride(finding.id, patch);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save the override.");
    } finally {
      setSaving(false);
    }
  }

  const overridden = Boolean(finding.reviewerVerdict);

  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-l-4 border-transparent px-5 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <VerdictBadge verdict={finding.effectiveVerdict} />
            <span className="font-mono text-[11px] text-ink-500">{finding.clause.clauseRef}</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                finding.clause.mandatory ? "bg-ink-100 text-ink-700" : "bg-ink-50 text-ink-500"
              }`}
            >
              {finding.clause.mandatory ? "Mandatory" : "Advisory"}
            </span>
            <span className="rounded bg-ink-50 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
              {finding.clause.scope === "COMMON_CORE" ? "Common core" : "Device-specific"}
            </span>
            {overridden && (
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-sky-700">
                Reviewer override
              </span>
            )}
          </div>

          <h3 className="mt-2 text-sm font-semibold leading-snug">{finding.clause.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">{finding.clause.requirementText}</p>

          {finding.aiEvidenceSnippet && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 ${
                finding.aiEvidenceKind === "semantic" ? "bg-ink-50 ring-1 ring-inset ring-ink-200" : "bg-ink-50"
              }`}
            >
              <div className="label mb-1">
                {finding.aiEvidenceKind === "semantic" ? (
                  <>
                    Closest related passage{" "}
                    <span className="font-normal normal-case tracking-normal text-ink-400">
                      — retrieved for context; it does not match this requirement
                    </span>
                  </>
                ) : (
                  "Evidence found"
                )}
              </div>
              <p
                className={`font-mono text-[11px] leading-relaxed ${
                  finding.aiEvidenceKind === "semantic" ? "text-ink-500" : "text-ink-700"
                }`}
              >
                “{finding.aiEvidenceSnippet}”
              </p>
            </div>
          )}

          {finding.aiEngine !== "llm" && finding.aiVerdict === "PASS" && (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-500">
              <span className="font-semibold text-ink-600">Offline pass:</span> the expected particulars are present in
              the dossier. Substantive adequacy — validity dates, the correct entity, the right kind of evidence — is not
              verified by the offline matcher (measured: it passes 5 of 14 hard distractors). Confirm on review or enable
              LLM verification.
            </p>
          )}

          {finding.aiFixNote && (
            <div
              className={`mt-3 rounded-lg px-3 py-2 ${
                finding.aiVerdict === "REJECT" ? "bg-rose-50" : "bg-amber-50"
              }`}
            >
              <div className="label mb-1">Required action</div>
              <p
                className={`text-xs leading-relaxed ${
                  finding.aiVerdict === "REJECT" ? "text-rose-800" : "text-amber-900"
                }`}
              >
                {finding.aiFixNote}
              </p>
            </div>
          )}

          {finding.reviewerComment && (
            <div className="mt-3 rounded-lg bg-sky-50 px-3 py-2">
              <div className="label mb-1">Reviewer comment</div>
              <p className="text-xs leading-relaxed text-sky-900">{finding.reviewerComment}</p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="text-right">
            <div className="label">Confidence</div>
            <div className="text-lg font-bold">{Math.round(finding.aiConfidence * 100)}%</div>
            <div className="text-[10px] text-ink-500">{finding.aiEngine === "llm" ? "LLM" : "hybrid"}</div>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-ink-600 hover:text-ink-900 hover:underline"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Close review" : "Review"}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-ink-50 px-5 py-4">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <label className="label" htmlFor={`comment-${finding.id}`}>
                Reviewer comment
              </label>
              <textarea
                id={`comment-${finding.id}`}
                rows={3}
                className="input mt-2 text-xs"
                placeholder="Record why you agree or disagree with the automated verdict…"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  className="btn-ghost text-xs"
                  disabled={saving}
                  onClick={() => save({ reviewerComment: comment })}
                >
                  Save comment
                </button>
                {saving && <span className="text-xs text-ink-500">Saving…</span>}
                {saved && <span className="text-xs font-semibold text-emerald-600">Saved</span>}
                {saveError && <span className="text-xs text-rose-600">{saveError}</span>}
              </div>
            </div>

            <div>
              <div className="label">Override verdict</div>
              <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
                AI verdict: <strong>{VERDICT_LABEL[finding.aiVerdict]}</strong>
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {(["PASS", "MINOR_IMPROVEMENT", "REJECT"] as Verdict[]).map((verdict) => (
                  <button
                    key={verdict}
                    type="button"
                    disabled={saving}
                    onClick={() => save({ reviewerVerdict: verdict, reviewerComment: comment })}
                    className={`rounded-lg border px-3 py-1.5 text-left text-xs font-semibold transition ${
                      finding.reviewerVerdict === verdict
                        ? "border-ink-900 bg-ink-900 text-white"
                        : "border-ink-200 bg-white text-ink-700 hover:border-ink-400"
                    }`}
                  >
                    {VERDICT_LABEL[verdict]}
                  </button>
                ))}
                {overridden && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => save({ reviewerVerdict: null })}
                    className="mt-1 text-left text-[11px] font-semibold text-ink-500 hover:text-ink-900 hover:underline"
                  >
                    Clear override and restore the AI verdict
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-ink-200 pt-3">
            <div className="label mb-1">Reviewer guidance for this clause</div>
            <p className="text-[11px] leading-relaxed text-ink-600">{finding.clause.guidance}</p>
          </div>
        </div>
      )}
    </article>
  );
}
