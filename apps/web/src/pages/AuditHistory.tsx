import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import type { AuditSummaryRow, DeviceType, Verdict } from "../types";
import { EmptyState, ErrorNote, Spinner, VerdictBadge, VerdictBar, formatDate } from "../components/ui";

export default function AuditHistory() {
  const [audits, setAudits] = useState<AuditSummaryRow[]>([]);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [deviceFilter, setDeviceFilter] = useState("ALL");
  const [resultFilter, setResultFilter] = useState<"ALL" | Verdict>("ALL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.audits(), api.deviceTypes()])
      .then(([a, d]) => {
        setAudits(a);
        setDevices(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(
    () =>
      audits.filter(
        (audit) =>
          (deviceFilter === "ALL" || audit.deviceType.id === deviceFilter) &&
          (resultFilter === "ALL" || (audit.status === "COMPLETED" && audit.overallResult === resultFilter)),
      ),
    [audits, deviceFilter, resultFilter],
  );

  if (error) return <ErrorNote message={error} />;
  if (loading) return <Spinner label="Loading audit history…" />;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit history</h1>
          <p className="mt-1 text-sm text-ink-500">
            Every dossier screened on this installation, newest first.
          </p>
        </div>
        <Link to="/new" className="btn-primary">
          New audit
        </Link>
      </header>

      {audits.length === 0 ? (
        <EmptyState
          title="No audits yet"
          body="Run your first compliance audit to build the history and populate the dashboard."
          action={
            <Link to="/new" className="btn-primary">
              Run an audit
            </Link>
          }
        />
      ) : (
        <>
          <div className="card flex flex-wrap items-end gap-4 p-4">
            <div>
              <label className="label" htmlFor="device-filter">
                Device type
              </label>
              <select
                id="device-filter"
                className="input mt-1.5 w-56"
                value={deviceFilter}
                onChange={(event) => setDeviceFilter(event.target.value)}
              >
                <option value="ALL">All device types</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="result-filter">
                Result
              </label>
              <select
                id="result-filter"
                className="input mt-1.5 w-56"
                value={resultFilter}
                onChange={(event) => setResultFilter(event.target.value as "ALL" | Verdict)}
              >
                <option value="ALL">All results</option>
                <option value="PASS">Pass</option>
                <option value="MINOR_IMPROVEMENT">Minor improvement required</option>
                <option value="REJECT">Reject</option>
              </select>
            </div>
            <div className="ml-auto text-xs text-ink-500">
              Showing {rows.length} of {audits.length}
            </div>
          </div>

          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Dossier</th>
                  <th className="px-5 py-3 font-semibold">Device type</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Breakdown</th>
                  <th className="px-5 py-3 font-semibold">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((audit) => (
                  <tr key={audit.id} className="transition hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link to={`/audits/${audit.id}`} className="font-semibold hover:underline">
                        {audit.dossierFilename}
                      </Link>
                      <div className="text-[11px] text-ink-500">
                        {audit.clauseCount} clauses
                        {audit.overriddenCount > 0 && ` · ${audit.overriddenCount} overridden`}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div>{audit.deviceType.name}</div>
                      <div className="text-[11px] text-ink-500">Class {audit.deviceType.riskClass}</div>
                    </td>
                    <td className="px-5 py-3 text-xs text-ink-500">{formatDate(audit.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="w-36">
                        <VerdictBar counts={audit.counts} />
                        <div className="mt-1 text-[11px] text-ink-500">
                          {audit.counts.PASS}/{audit.counts.MINOR_IMPROVEMENT}/{audit.counts.REJECT}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {audit.status === "COMPLETED" ? (
                        <VerdictBadge verdict={audit.overallResult} />
                      ) : audit.status === "RUNNING" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                          <span className="h-2.5 w-2.5 animate-spin rounded-full border border-sky-300 border-t-sky-700" />
                          Screening…
                        </span>
                      ) : (
                        <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">Failed</span>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-ink-500">
                      No audits match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
