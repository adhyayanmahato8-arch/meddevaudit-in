import { useEffect, useMemo, useState } from "react";
import { REFERENCE_SECTIONS, TEST_DOCUMENTS, type Reference } from "../data/references";

type SampleIndexEntry = { file: string; title: string; device: string; expected: string; description: string };

const ACCESS_LABEL: Record<Reference["access"], { text: string; className: string }> = {
  free: { text: "Free PDF", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  catalogue: { text: "Catalogue page · paid standard", className: "bg-amber-50 text-amber-800 border-amber-200" },
  portal: { text: "Web page", className: "bg-ink-50 text-ink-600 border-ink-200" },
};

const KIND_LABEL: Record<Reference["kind"], string> = {
  rules: "Rules",
  notification: "Notification",
  form: "Form",
  guidance: "Guidance",
  portal: "Portal",
  standard: "Standard",
};

export default function References() {
  const [query, setQuery] = useState("");
  const [samples, setSamples] = useState<SampleIndexEntry[]>([]);

  useEffect(() => {
    fetch("/samples/index.json")
      .then((r) => (r.ok ? r.json() : []))
      .then(setSamples)
      .catch(() => setSamples([]));
  }, []);

  const needle = query.trim().toLowerCase();
  const sections = useMemo(
    () =>
      REFERENCE_SECTIONS.map((s) => ({
        ...s,
        items: s.items.filter(
          (r) =>
            !needle ||
            r.designation.toLowerCase().includes(needle) ||
            r.title.toLowerCase().includes(needle) ||
            r.issuer.toLowerCase().includes(needle) ||
            r.citedBy.some((c) => c.toLowerCase().includes(needle)),
        ),
      })).filter((s) => s.items.length > 0),
    [needle],
  );

  const total = REFERENCE_SECTIONS.reduce((n, s) => n + s.items.length, 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">References</h1>
        <p className="mt-1 text-sm text-ink-500">
          Every rule, form, guidance document and standard the clause library cites, linked to its authoritative
          source, plus real public documents you can upload to test the auditor. All {total} links were fetched and
          verified on 17 September 2026.
        </p>
      </header>

      <div className="card flex flex-wrap items-end gap-4 p-4">
        <div className="min-w-[240px] flex-1">
          <label className="label" htmlFor="ref-search">
            Search references
          </label>
          <input
            id="ref-search"
            className="input mt-1.5"
            placeholder="ISO 13485, MD-15, labelling, CORE-FSC…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <nav className="flex flex-wrap gap-2 text-xs">
          {REFERENCE_SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="rounded-full border border-ink-200 bg-white px-3 py-1 font-semibold text-ink-600 hover:border-ink-400">
              {s.title}
            </a>
          ))}
          <a href="#test-documents" className="rounded-full border border-ink-200 bg-white px-3 py-1 font-semibold text-ink-600 hover:border-ink-400">
            Test documents
          </a>
        </nav>
      </div>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="scroll-mt-6 space-y-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">{section.title}</h2>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{section.blurb}</p>
          </div>
          <div className="card divide-y divide-ink-100">
            {section.items.map((ref) => (
              <div key={ref.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-ink-600">{KIND_LABEL[ref.kind]}</span>
                    <span className="font-mono text-[11px] text-ink-500">{ref.designation}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${ACCESS_LABEL[ref.access].className}`}>
                      {ACCESS_LABEL[ref.access].text}
                    </span>
                  </div>
                  <a href={ref.url} target="_blank" rel="noreferrer" className="mt-1.5 block text-sm font-semibold leading-snug hover:underline">
                    {ref.title}
                  </a>
                  <div className="mt-0.5 text-xs text-ink-500">{ref.issuer}</div>
                  {ref.note && <p className="mt-2 text-xs leading-relaxed text-ink-600">{ref.note}</p>}
                  {ref.citedBy.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-[10px] uppercase tracking-wide text-ink-400">Cited by</span>
                      {ref.citedBy.map((code) => (
                        <span key={code} className="rounded bg-ink-50 px-1.5 py-0.5 font-mono text-[10px] text-ink-600">
                          {code}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <a href={ref.url} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 text-xs">
                  Open ↗
                </a>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section id="test-documents" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink-600">Documents for testing the auditor</h2>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">
            Two sets. <strong>Synthetic dossiers</strong> are generated from the project&rsquo;s evaluation fixtures and
            carry a known expected result — they are the only way to see a PASS, because no public document for a
            foreign device contains an Indian MD-15 licence, Form MD-14, importer label or bilingual declaration.{" "}
            <strong>Real public documents</strong> (FDA 510(k) summaries, manufacturer instructions, an EU Declaration
            of Conformity) exercise the technical clauses realistically and will REJECT on the India-specific ones — which
            is the correct outcome. Every real file was checked to be downloadable and to yield extractable text.
          </p>
        </div>

        {samples.length > 0 && (
          <div className="card">
            <div className="border-b border-ink-200 px-5 py-3 text-xs">
              <span className="font-semibold">Synthetic dossiers with known expected results</span> (download, then upload in New Audit).{" "}
              <span className="text-ink-500">
                &ldquo;Expect&rdquo; is the annotated ground truth. The offline matcher does not always reach it — it
                passes on-topic-but-inadequate text (see the measured figures under Settings), so a file marked MINOR may
                come out PASS. That gap is the measured limitation, not a broken file.
              </span>
            </div>
            <div className="divide-y divide-ink-100">
              {samples.map((s) => (
                <div key={s.file} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/samples/${s.file}`} className="text-sm font-semibold hover:underline" download>
                        {s.file}
                      </a>
                      <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">{s.device}</span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                          s.expected === "PASS"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : s.expected === "REJECT"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        expect {s.expected}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{s.description}</p>
                  </div>
                  <a href={`/samples/${s.file}`} className="btn-ghost shrink-0 text-xs" download>
                    Download PDF
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <div className="border-b border-ink-200 px-5 py-3 text-xs font-semibold">Real public documents ({TEST_DOCUMENTS.length})</div>
          <div className="divide-y divide-ink-100">
            {TEST_DOCUMENTS.map((d) => (
              <div key={d.url} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-semibold text-ink-600">{d.device}</span>
                    <span className="text-[10px] uppercase tracking-wide text-ink-400">{d.kind}</span>
                    <span className="text-[10px] text-ink-400">{d.pages} pp</span>
                  </div>
                  <a href={d.url} target="_blank" rel="noreferrer" className="mt-1 block text-sm font-semibold leading-snug hover:underline">
                    {d.title}
                  </a>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500">
                    <span className="font-semibold text-ink-600">Expected: </span>
                    {d.expected}
                  </p>
                </div>
                <a href={d.url} target="_blank" rel="noreferrer" className="btn-ghost shrink-0 text-xs">
                  Open PDF ↗
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
