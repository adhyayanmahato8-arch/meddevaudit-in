import type { ReactNode } from "react";
import type { Verdict, VerdictCounts } from "../types";

export const VERDICT_LABEL: Record<Verdict, string> = {
  PASS: "Pass",
  MINOR_IMPROVEMENT: "Minor improvement",
  REJECT: "Reject",
};

const VERDICT_STYLE: Record<Verdict, string> = {
  PASS: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MINOR_IMPROVEMENT: "bg-amber-50 text-amber-800 border-amber-200",
  REJECT: "bg-rose-50 text-rose-700 border-rose-200",
};

const VERDICT_DOT: Record<Verdict, string> = {
  PASS: "bg-emerald-500",
  MINOR_IMPROVEMENT: "bg-amber-500",
  REJECT: "bg-rose-500",
};

export function VerdictBadge({ verdict, size = "sm" }: { verdict: Verdict; size?: "sm" | "lg" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${VERDICT_STYLE[verdict]} ${
        size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${VERDICT_DOT[verdict]}`} />
      {VERDICT_LABEL[verdict]}
    </span>
  );
}

export function VerdictBar({ counts }: { counts: VerdictCounts }) {
  const total = counts.PASS + counts.MINOR_IMPROVEMENT + counts.REJECT || 1;
  const segments: { verdict: Verdict; className: string }[] = [
    { verdict: "PASS", className: "bg-emerald-500" },
    { verdict: "MINOR_IMPROVEMENT", className: "bg-amber-500" },
    { verdict: "REJECT", className: "bg-rose-500" },
  ];
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-ink-100">
      {segments.map((segment) => (
        <div
          key={segment.verdict}
          className={segment.className}
          style={{ width: `${(counts[segment.verdict] / total) * 100}%` }}
          title={`${VERDICT_LABEL[segment.verdict]}: ${counts[segment.verdict]}`}
        />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: "emerald" | "amber" | "rose" | "ink";
}) {
  const accents = {
    emerald: "text-emerald-600",
    amber: "text-amber-600",
    rose: "text-rose-600",
    ink: "text-ink-900",
  } as const;
  return (
    <div className="card p-5">
      <div className="label">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accents[accent ?? "ink"]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-500">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <div className="text-base font-semibold text-ink-900">{title}</div>
      <p className="max-w-md text-sm text-ink-500">{body}</p>
      {action}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-ink-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-300 border-t-ink-700" />
      {label ?? "Loading…"}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{message}</div>
  );
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function engineLabel(engine: string): string {
  if (engine === "llm") return "Grounded LLM verification";
  if (engine === "mixed") return "LLM + hybrid fallback";
  return "Hybrid lexical + semantic matcher";
}
