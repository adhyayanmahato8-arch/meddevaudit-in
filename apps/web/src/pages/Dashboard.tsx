import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { DashboardSummary, DeviceType } from "../types";
import {
  EmptyState,
  ErrorNote,
  Spinner,
  StatCard,
  VerdictBadge,
  VerdictBar,
  formatDate,
} from "../components/ui";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.summary(), api.deviceTypes()])
      .then(([s, d]) => {
        setSummary(s);
        setDevices(d);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <ErrorNote message={error} />;
  if (!summary) return <Spinner label="Loading dashboard…" />;

  const clausesPerAudit = devices.length > 0 ? devices[0].totalClauseCount : 0;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-500">
            Clause-by-clause screening of imported device dossiers against the Medical Device Rules, 2017.
          </p>
        </div>
        <Link to="/new" className="btn-primary">
          New audit
        </Link>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Audits run" value={summary.totalAudits} hint={`${clausesPerAudit} clauses screened per audit`} />
        <StatCard
          label="Pass rate"
          value={`${summary.passRate}%`}
          accent={summary.passRate >= 50 ? "emerald" : "amber"}
          hint={`${summary.resultTotals.PASS} of ${summary.totalAudits} dossiers cleared`}
        />
        <StatCard
          label="Minor improvement"
          value={summary.resultTotals.MINOR_IMPROVEMENT}
          accent="amber"
          hint="Incomplete evidence, fixable"
        />
        <StatCard
          label="Rejected"
          value={summary.resultTotals.REJECT}
          accent="rose"
          hint="A mandatory clause is unmet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="card lg:col-span-3">
          <div className="border-b border-ink-200 px-5 py-4">
            <h2 className="text-sm font-semibold">Recent audits</h2>
          </div>
          {summary.recent.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink-500">
              No audits yet.{" "}
              <Link to="/new" className="font-semibold text-ink-900 underline">
                Run your first one
              </Link>
              .
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {summary.recent.map((audit) => (
                <li key={audit.id}>
                  <Link to={`/audits/${audit.id}`} className="block px-5 py-4 transition hover:bg-ink-50">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{audit.dossierFilename}</div>
                        <div className="mt-0.5 text-xs text-ink-500">
                          {audit.deviceTypeName} · {formatDate(audit.createdAt)}
                        </div>
                      </div>
                      <VerdictBadge verdict={audit.overallResult} />
                    </div>
                    <div className="mt-3">
                      <VerdictBar counts={audit.counts} />
                      <div className="mt-1.5 text-[11px] text-ink-500">
                        {audit.counts.PASS} pass · {audit.counts.MINOR_IMPROVEMENT} minor ·{" "}
                        {audit.counts.REJECT} reject
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card lg:col-span-2">
          <div className="border-b border-ink-200 px-5 py-4">
            <h2 className="text-sm font-semibold">Most common gaps</h2>
            <p className="mt-0.5 text-xs text-ink-500">Clauses failing most often across all audits</p>
          </div>
          {summary.topGaps.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ink-500">
              Nothing flagged yet — run an audit to populate this.
            </div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {summary.topGaps.map((gap) => (
                <li key={gap.clauseRef} className="flex items-start gap-3 px-5 py-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                    {gap.count}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{gap.title}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-ink-500">{gap.clauseRef}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold">Supported device types</h2>
        {devices.length === 0 ? (
          <EmptyState title="Rule library empty" body="Run npm run db:reset to re-seed the MDR-2017 clause set." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => (
              <div key={device.id} className="card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm font-semibold leading-snug">{device.name}</div>
                  <span className="shrink-0 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-700">
                    Class {device.riskClass}
                  </span>
                </div>
                <div className="mt-2 font-mono text-[11px] text-ink-500">{device.particularStandard}</div>
                <p className="mt-3 text-xs leading-relaxed text-ink-500">{device.summary}</p>
                <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-3 text-[11px] text-ink-500">
                  <span>
                    {device.totalClauseCount} clauses ({device.commonCoreClauseCount} core +{" "}
                    {device.specificClauseCount} specific)
                  </span>
                  <span>{device.auditCount} audits</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
