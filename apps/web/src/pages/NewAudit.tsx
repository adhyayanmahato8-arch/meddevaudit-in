import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import type { DeviceType } from "../types";
import { ErrorNote, Spinner } from "../components/ui";

export default function NewAudit() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<DeviceType[]>([]);
  const [deviceTypeId, setDeviceTypeId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .deviceTypes()
      .then((d) => {
        setDevices(d);
        if (d.length > 0) setDeviceTypeId(d[0].id);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!running) return;
    const started = Date.now();
    const timer = window.setInterval(() => setElapsed(Math.round((Date.now() - started) / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [running]);

  const selected = useMemo(() => devices.find((d) => d.id === deviceTypeId), [devices, deviceTypeId]);
  const canRun = Boolean(deviceTypeId) && (files.length > 0 || text.trim().length > 0) && !running;

  async function run() {
    setError("");
    setRunning(true);
    try {
      const result = await api.createAudit({ deviceTypeId, files, text });
      navigate(`/audits/${result.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "The audit failed to run.");
      setRunning(false);
    }
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((current) => [...current, ...Array.from(list)].slice(0, 10));
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">New audit</h1>
        <p className="mt-1 text-sm text-ink-500">
          Select the device category, submit the import dossier, and screen it against every applicable MDR-2017
          clause.
        </p>
      </header>

      {error && <ErrorNote message={error} />}

      <section className="card p-6">
        <div className="label mb-3">1 · Device type</div>
        {devices.length === 0 ? (
          <Spinner label="Loading device types…" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {devices.map((device) => {
              const active = device.id === deviceTypeId;
              return (
                <button
                  key={device.id}
                  type="button"
                  onClick={() => setDeviceTypeId(device.id)}
                  disabled={running}
                  className={`rounded-xl border p-4 text-left transition ${
                    active
                      ? "border-ink-900 bg-ink-900 text-white shadow-sm"
                      : "border-ink-200 bg-white hover:border-ink-400"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold leading-snug">{device.name}</span>
                    <span
                      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                        active ? "bg-white/15 text-white" : "bg-ink-100 text-ink-700"
                      }`}
                    >
                      {device.riskClass}
                    </span>
                  </div>
                  <div className={`mt-2 font-mono text-[11px] ${active ? "text-emerald-300" : "text-ink-500"}`}>
                    {device.particularStandard}
                  </div>
                  <div className={`mt-2 text-[11px] ${active ? "text-ink-200" : "text-ink-500"}`}>
                    {device.totalClauseCount} clauses will be screened
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="label mb-3">2 · Dossier</div>

        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            if (!running) addFiles(event.dataTransfer.files);
          }}
          className="rounded-xl border-2 border-dashed border-ink-200 bg-ink-50 px-6 py-8 text-center"
        >
          <p className="text-sm font-medium">Drop the Device Master File, labels, IFU and test reports here</p>
          <p className="mt-1 text-xs text-ink-500">PDF, DOCX, TXT, MD or CSV · up to 10 files · 25 MB each</p>
          <button
            type="button"
            className="btn-ghost mt-4"
            disabled={running}
            onClick={() => fileInput.current?.click()}
          >
            Browse files
          </button>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv"
            className="hidden"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="mt-4 divide-y divide-ink-100 rounded-lg border border-ink-200">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{file.name}</div>
                  <div className="text-[11px] text-ink-500">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button
                  type="button"
                  disabled={running}
                  className="text-xs font-semibold text-rose-600 hover:underline"
                  onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <label className="label" htmlFor="dossier-text">
            Or paste dossier text
          </label>
          <textarea
            id="dossier-text"
            rows={8}
            className="input mt-2 font-mono text-xs"
            placeholder={"Paste the declaration, label artwork text, certificate details and test report summaries here…"}
            value={text}
            disabled={running}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="mt-1 text-[11px] text-ink-500">
            {text.trim().length.toLocaleString()} characters. Pasted text is screened alongside any uploaded files.
          </div>
        </div>
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="text-sm text-ink-500">
          {selected ? (
            <>
              Screening <span className="font-semibold text-ink-900">{selected.totalClauseCount} clauses</span> for{" "}
              <span className="font-semibold text-ink-900">{selected.name}</span>.
            </>
          ) : (
            "Select a device type to continue."
          )}
        </div>
        <button type="button" className="btn-primary" disabled={!canRun} onClick={run}>
          {running ? "Running…" : "Run compliance audit"}
        </button>
      </section>

      {running && (
        <div className="card flex items-center gap-4 p-6">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink-300 border-t-ink-900" />
          <div>
            <div className="text-sm font-semibold">Uploading and extracting text…</div>
            <div className="mt-0.5 text-xs text-ink-500">
              Screening runs in the background; you will be taken to the report, which updates as clauses complete.{" "}
              {elapsed}s elapsed.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
