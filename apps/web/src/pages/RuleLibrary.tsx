import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { Clause, DeviceType } from "../types";
import { ErrorNote, Spinner } from "../components/ui";

export default function RuleLibrary() {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [scope, setScope] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.clauses(), api.deviceTypes()])
      .then(([c, d]) => {
        setClauses(c);
        setDevices(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return clauses.filter((clause) => {
      const scopeMatch =
        scope === "ALL" ||
        (scope === "COMMON_CORE" && clause.deviceTypeId === null) ||
        clause.deviceTypeId === scope;
      if (!scopeMatch) return false;
      if (!needle) return true;
      return (
        clause.title.toLowerCase().includes(needle) ||
        clause.clauseRef.toLowerCase().includes(needle) ||
        clause.requirementText.toLowerCase().includes(needle) ||
        clause.category.toLowerCase().includes(needle)
      );
    });
  }, [clauses, scope, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Clause[]>();
    for (const clause of filtered) {
      const key = clause.deviceTypeName ?? "Common core — applies to every device";
      const list = map.get(key) ?? [];
      list.push(clause);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [filtered]);

  if (error) return <ErrorNote message={error} />;
  if (loading) return <Spinner label="Loading rule library…" />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rule library</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every clause the auditor screens against, in full. Nothing is screened that is not listed here — this is what
          makes a finding traceable back to a named requirement.
        </p>
      </header>

      <div className="card flex flex-wrap items-end gap-4 p-4">
        <div>
          <label className="label" htmlFor="scope">
            Scope
          </label>
          <select
            id="scope"
            className="input mt-1.5 w-64"
            value={scope}
            onChange={(event) => setScope(event.target.value)}
          >
            <option value="ALL">All clauses ({clauses.length})</option>
            <option value="COMMON_CORE">Common core only</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.name} — device-specific
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[220px] flex-1">
          <label className="label" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            className="input mt-1.5"
            placeholder="ISO 13485, labelling, MD-15, biocompatibility…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="text-xs text-ink-500">{filtered.length} shown</div>
      </div>

      {grouped.length === 0 ? (
        <div className="card px-6 py-12 text-center text-sm text-ink-500">No clauses match your search.</div>
      ) : (
        grouped.map(([group, items]) => (
          <section key={group} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">
              {group} <span className="font-normal normal-case text-ink-400">· {items.length} clauses</span>
            </h2>
            <div className="card divide-y divide-ink-100">
              {items.map((clause) => (
                <div key={clause.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-ink-500">{clause.clauseRef}</span>
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">
                      {clause.category}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        clause.mandatory ? "bg-ink-900 text-white" : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      {clause.mandatory ? "Mandatory" : "Advisory"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-sm font-semibold leading-snug">{clause.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-600">{clause.requirementText}</p>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-[11px] font-semibold text-ink-500 hover:text-ink-900">
                      Reviewer guidance
                    </summary>
                    <p className="mt-1.5 rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-600">
                      {clause.guidance}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
