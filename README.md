# MedDevAudit-IN

A working compliance-review tool that screens **imported medical device documentation dossiers** clause-by-clause against **India's Medical Device Rules, 2017 (MDR-2017)**, and returns a per-requirement verdict — **PASS / MINOR IMPROVEMENT REQUIRED / REJECT** — with the cited clause, an evidence quote from the dossier, a confidence score and a specific fix note.

Built for BBMD207L *Hospital Management* (Course Project, Review I).

---

## Quick Start

You need **Node.js 18.18 or newer**. Nothing else — no database server, no API key, no Docker.

1. **Install**

   ```bash
   cd meddevaudit-in
   npm install
   ```

2. **Run**

   ```bash
   npm run dev
   ```

   The first run generates the Prisma client, creates the SQLite database and seeds all 33 MDR-2017 clauses automatically. Subsequent runs skip straight to starting the servers.

3. **Open** <http://localhost:5173> in your browser.

The API runs on <http://localhost:4000>; the Vite dev server proxies `/api` to it, so the frontend only ever uses relative paths.

**Try it immediately:** go to **New Audit**, pick *Pulse Oximeter*, upload `samples/pulse-oximeter-complete.txt`, and run the audit. Then repeat with *Digital Blood Pressure Monitor* and `samples/bp-monitor-deficient.txt` to see a rejection.

---

## Deployment (public URL)

The app deploys as **one web service** that hosts both the API and the built React app on a single URL — no CORS, no second service. Verified locally with the exact commands the host runs (`npm ci && npm run build && npm run setup`, then `npm start`).

### Option A — Render (recommended; free tier; ~15 minutes)

Prerequisites on your machine: Git and a GitHub account. If Git is not installed:

```powershell
winget install --id Git.Git -e --source winget
```
(then close and reopen your terminal).

1. **Create the repository and push.** In the `meddevaudit-in` folder:

   ```powershell
   git init
   git add .
   git commit -m "MedDevAudit-IN: initial deployable build"
   git branch -M main
   ```
   Create an empty repository on GitHub (https://github.com/new — name it `meddevaudit-in`, leave everything else unticked), then:
   ```powershell
   git remote add origin https://github.com/<your-github-username>/meddevaudit-in.git
   git push -u origin main
   ```

2. **Deploy on Render.** Sign in at https://dashboard.render.com (GitHub login works). Click **New → Blueprint**, pick the `meddevaudit-in` repository, and click **Apply**. Render reads [render.yaml](render.yaml) and builds the service. First build takes ~5–8 minutes (installs, builds the frontend, seeds the database, downloads the 23 MB embedding model).

3. **Open the URL.** Render shows it at the top of the service page, in the form `https://meddevaudit-in-XXXX.onrender.com`. `/api/health` on that URL should return `{"ok":true,...}`.

**Optional environment variables** (Render → your service → *Environment*): `ANTHROPIC_API_KEY` to enable Claude verification; `ANTHROPIC_MODEL`, `AI_CONCURRENCY`, `HYBRID_ALPHA`, `AUDIT_RATE_LIMIT` as documented in [.env.example](.env.example).

**Redeploying after changes:** commit and push to `main`. Render redeploys automatically (`autoDeploy: true`). Or click **Manual Deploy → Deploy latest commit**.

**Free-tier behaviour to know about.** (1) The disk is ephemeral: the rule library, embeddings and demo dossiers are baked in at build time and always present, but *audits run by users are lost on the next deploy or restart*. To keep them, attach a Render persistent disk (paid) or move to Postgres — see below. (2) The service sleeps after 15 minutes idle; the first request afterwards takes ~30–60 s to wake. (3) 512 MB RAM is enough for the embedding model, but very large dossiers (hundreds of pages) may be slow.

### Option B — Docker (Railway, Fly.io, Cloud Run, any VPS)

A [Dockerfile](Dockerfile) builds a self-contained image. Locally:
```powershell
docker build -t meddevaudit-in .
docker run -p 4000:4000 meddevaudit-in     # → http://localhost:4000
```
On Railway: **New Project → Deploy from GitHub repo**; it detects the Dockerfile. Set `PORT` if the platform does not inject it.

### Persistent audits: switching to Postgres

The schema is Postgres-compatible. Create a free database at https://neon.tech, then in `packages/db/prisma/schema.prisma` change `provider = "sqlite"` to `provider = "postgresql"` and `url = "file:./dev.db"` to `url = env("DATABASE_URL")`, set `DATABASE_URL` in the host's environment, and redeploy. `npm run setup` will create the tables and seed them. No model changes are needed.

### Production hardening already in place
- Frontend served from the API process with immutable caching for fingerprinted assets and SPA fallback routing.
- `X-Powered-By` disabled; CORS closed by default in production (open only via `CORS_ORIGIN`).
- Per-IP rate limit on audit runs (`AUDIT_RATE_LIMIT`, default 20/min).
- Upload limits: 25 MB per file, 10 files; JSON body 10 MB.
- Health endpoint at `/api/health` for platform checks.

---

## Optional: LLM-powered verification

The app is fully functional with no configuration. If you want clause verification done by Claude instead of the built-in deterministic matcher:

```bash
cp .env.example .env      # Windows: copy .env.example .env
```

then set `ANTHROPIC_API_KEY=sk-ant-...` in `.env` (get one from <https://console.anthropic.com>) and restart `npm run dev`. **Settings** in the app shows which engine is live, and every finding is labelled `LLM` or `keyword` so the two are never confused.

Without a key the app still runs end-to-end — it just uses the deterministic matcher. That is a real, working matcher, not a stub; see *How the matching works* below.

---

## Architecture

```
                 ┌──────────────────────────────────────────────┐
  Browser  ──▶   │  apps/web — React 18 + Vite + TS + Tailwind   │
  :5173          │  Dashboard · New Audit · Report · History ·   │
                 │  Rule Library · Settings                      │
                 └───────────────────┬──────────────────────────┘
                                     │  /api/*  (Vite proxy)
                 ┌───────────────────▼──────────────────────────┐
                 │  apps/api — Express + TypeScript              │
                 │                                              │
                 │  1 INGEST     pdf-parse / mammoth / raw text  │
                 │  2 SELECT     common core + device clauses    │
                 │  3 MATCH      ┌── LLM (grounded, strict JSON) │
                 │               └── hybrid BM25 + embeddings    │
                 │                   (all-MiniLM-L6-v2, offline) │
                 │  4 DECIDE     per-clause verdict + overall    │
                 │  5 REPORT     JSON + pdfkit PDF export        │
                 └───────────────────┬──────────────────────────┘
                                     │  Prisma
                 ┌───────────────────▼──────────────────────────┐
                 │  packages/db — SQLite (file-based)           │
                 │  DeviceType · Clause · Audit · Finding        │
                 └──────────────────────────────────────────────┘
```

```
meddevaudit-in/
├── apps/
│   ├── api/                 Express REST API
│   │   └── src/
│   │       ├── index.ts             server + error handling + local session
│   │       ├── env.ts               configuration with working defaults
│   │       ├── routes/
│   │       │   ├── catalogue.ts     device types + rule library
│   │       │   └── audits.ts        run / read / override / export
│   │       └── services/
│   │           ├── extractText.ts   PDF, DOCX and plain-text ingestion
│   │           ├── bm25.ts          BM25 passage index (k1=1.5, b=0.75)
│   │           ├── embeddings.ts    local sentence embeddings (@xenova/transformers)
│   │           ├── retrieval.ts     hybrid fusion: α·semantic + (1−α)·BM25
│   │           ├── thresholds.ts    verdict decision rule (calibratable)
│   │           ├── matcher.ts       LLM + hybrid matchers, orchestration
│   │           ├── verdicts.ts      the verdict rules, in one place
│   │           └── pdfReport.ts     audit-report PDF generation
│   └── web/                 React frontend
│       └── src/
│           ├── api.ts, types.ts
│           ├── components/  Layout, shared UI
│           └── pages/       Dashboard, NewAudit, AuditReport,
│                            AuditHistory, RuleLibrary, Settings
├── packages/db/             Prisma schema + the 33-clause seed
├── samples/                 Two demo dossiers (complete / deficient)
├── scripts/setup.mjs        Idempotent first-run provisioning
└── .env.example
```

---

## Scope: what is actually encoded

Five low/moderate-risk non-invasive electronic devices that share a regulatory backbone, so one rule engine covers all five with a small per-device delta:

| Device | MDR-2017 class | Particular standard | Clauses screened |
|---|---|---|---|
| Digital Thermometer | A | IEC 80601-2-56 | 13 core + 4 = **17** |
| Pulse Oximeter | B | ISO 80601-2-61 | 13 core + 4 = **17** |
| Digital BP Monitor (NIBP) | B | IEC 80601-2-30 | 13 core + 4 = **17** |
| ECG Machine (resting) | B | IEC 60601-2-25 | 13 core + 4 = **17** |
| Nebulizer | A/B | ISO 27427 / EN 13544-1 | 13 core + 4 = **17** |

**13 common-core clauses** (every device): MD-15 import licence · Form MD-14 + Indian Authorised Agent + power of attorney · Free Sale Certificate · ISO 13485 (valid, unexpired, in-scope) · ISO 14971 risk management file · IEC 60601-1 · IEC 60601-1-2 EMC · label manufacturer name and site address · label import-licence number and importer · bilingual Hindi/English "For Sale in India" · ISO 15223-1 symbols · Instructions for Use in English · Device Master File completeness.

**20 device-specific clauses** (4 each) cover the particular standard plus the clinical, software, alarm, reprocessing and biocompatibility requirements peculiar to that device.

Every clause is browsable in full, with reviewer guidance, on the **Rule Library** page. Nothing is screened that is not listed there — that is what makes a finding traceable.

### Verdict vocabulary

| Verdict | Meaning |
|---|---|
| **PASS** | The document or field is present and substantively satisfies every element of the requirement. |
| **MINOR IMPROVEMENT REQUIRED** | The dossier addresses the requirement but the evidence is incomplete, out of date, wrongly formatted or ambiguous. The finding names exactly which sub-requirement is unmet. |
| **REJECT** | A mandatory document or field is missing entirely, the dossier contradicts a hard requirement, or weaker evidence has been substituted for the kind the rule demands (e.g. bench data in place of clinical data). |

**Overall result:** REJECT if any *mandatory* clause is REJECT; MINOR IMPROVEMENT if any clause is MINOR_IMPROVEMENT (or a non-mandatory clause is REJECT) and no mandatory clause is REJECT; otherwise PASS. A reviewer override always supersedes the AI verdict, and the overall result is recomputed on every override.

---

## How the matching works

**With an API key** — each clause gets its own grounded call. The system prompt carries the CDSCO reviewer framing, the verdict definitions and the grounding rules (quote verbatim, absence is REJECT not PASS, a self-declaration is not a third-party certificate); the dossier text is attached as a cached system block so clauses 2..n are cheap; the clause under review is the user turn. The response is constrained by a strict JSON schema to `{verdict, confidence, evidence_snippet, fix_note}`. If one call fails, that clause alone falls back to the hybrid matcher and the audit records `engine: "mixed"`.

**Without an API key** — a hybrid of two local signals, which is the retrieval pattern Paper 7 argues for, implemented without a network dependency:

- **Coverage (rules-as-code).** Each clause carries pipe-separated keyword groups (synonyms comma-separated inside a group). Coverage is matched groups ÷ total.
- **BM25.** `services/bm25.ts` indexes the dossier's passages (k1 = 1.5, b = 0.75) and scores each clause's query — title, requirement text and the clause's **controlled vocabulary** (standard aliases such as "ISO 13485:2016" / "EN ISO 13485" / "QMS certificate", Indian form names, unit and numeral variants, common regulatory phrasings, seeded in the `synonyms` column).
- **Sentence embeddings.** `services/embeddings.ts` loads `all-MiniLM-L6-v2` (ONNX, quantised, ~23 MB) through `@xenova/transformers`. Clause embeddings are computed at seed time and stored; dossier passages are embedded at audit time; cosine similarity between them is the semantic score. The model downloads once and runs offline thereafter.
- **Fusion.** `score = α · semantic + (1 − α) · BM25`, α = **0.65** by default (`HYBRID_ALPHA`). That value is the empirical optimum reported by Rayo, de la Rosa & Garrido, *A Hybrid Approach to Information Retrieval and Answer Generation for Regulatory Texts* (COLING 2025) — Paper 7 of the literature review.
- **Degradation.** If the embedding model cannot be loaded, the index runs BM25 + vocabulary only and the Settings page and sidebar say so explicitly (`retrieval.mode = "lexical"` on `/api/health`).

**Decision rule** (`services/thresholds.ts`): PASS requires coverage ≥ `covPass` *and* retrieval ≥ `tauPass`; otherwise MINOR_IMPROVEMENT if coverage > 0 *or* retrieval ≥ `tauSoften`; otherwise REJECT. The asymmetry is deliberate: retrieval can *soften* a verdict and supply a "closest related passage" as context, but can **never** produce a PASS without lexical coverage. In compliance screening the costly error is the missed non-compliance, so the weaker signal is only allowed to raise doubt (Paper 12).

**Threshold status: PROVISIONAL.** The current values (`covPass` 1.0, `tauPass` 0.0, `tauSoften` 0.45, `tauContext` 0.20) are carried over from the earlier TF-IDF matcher and have *not* been re-measured against the BM25 + embedding scores. Calibration against an annotated evaluation set with a held-out split is the next piece of work; its results will replace this paragraph and be written to `reports/evaluation.md`. Until then, treat verdicts from the no-API-key matcher as a review aid with uncharacterised error rates.

**Known limitations (to be replaced by measured figures):**
- Semantic snippets are labelled *"Closest related passage — retrieved for context; it does not match this requirement"* in the UI and PDF because a nearest neighbour is not evidence.
- The two sample dossiers contain no case where a requirement is satisfied in wording the keyword groups missed, so recall on paraphrase is currently unmeasured.
- Distractors score high: on the deficient sample, the ISO 13485 clause reached 0.84 cosine against a passage that merely *mentions* a certificate "available on request". Embedding similarity measures topical closeness, not satisfaction — which is exactly why the decision rule does not let it produce a PASS, and why the evaluation set must contain hard negatives.

---

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Which engine and model are live |
| `GET` | `/api/device-types` | The five supported device categories |
| `GET` | `/api/clauses?deviceTypeId=` | Rule library; filtered = core + that device |
| `POST` | `/api/audits` | Run an audit (multipart files and/or JSON text) |
| `GET` | `/api/audits` | Audit history |
| `GET` | `/api/audits/summary` | Dashboard aggregates |
| `GET` | `/api/audits/:id` | Full report with findings and clauses |
| `PATCH` | `/api/audits/:id/findings/:findingId` | Reviewer override (`reviewerVerdict: null` clears it) |
| `GET` | `/api/audits/:id/export` | Download the PDF audit report |

---

## How this maps to the course literature review

| Theme | Papers | What the prototype implements |
|---|---|---|
| **A — AI + NLP for regulatory documentation** | 1–5 | The value case, plus the two design constraints Paper 3 identifies: explainability (every verdict carries its clause, evidence and confidence) and human-in-the-loop validation (the reviewer override on every finding). Paper 5's low-resource hybrid recipe is what the deterministic matcher is. |
| **B — Semantic text-matching & retrieval** | 6–11 | **Clause-level** indexing rather than document-level (Paper 9) — the `Clause` table *is* the clause-level index. Paper 7's hybrid lexical-plus-semantic retrieval is implemented literally in `semantic.ts` + `matcher.ts`: a lexical scorer and a TF-IDF vector-space scorer fused per clause. Paper 9's failure analysis is why semantic hits are labelled as context rather than evidence. Paper 11's caution (generic models miss fine medical distinctions) is why high-stakes clauses route to a human. |
| **C — LLMs for compliance verification** | 12–17 | The core task is **verification, not retrieval** (Paper 12) — the LLM is asked for a compliance judgment, not similar text. It is grounded rather than free-running (Paper 13). Paper 17's completeness-checking becomes the Device Master File clause and the mandatory-document checks. Paper 16's rules-as-code idea appears as the deterministic clause rules. |
| **D — Medical-device landscape & India** | 18–20 | Paper 20 defines the exact ruleset: MDR-2017, Class A/B/C/D, the ~70 % import figure that motivates an import-documentation auditor. Paper 19's marketing-versus-clearance mismatch is the value proposition — flagging where claimed documentation and the actual regulatory record diverge. |

**Research gaps addressed:** #1 India-first engine (the rule library is MDR-2017, not FDA/EU) · #2 retrieval ≠ verification (verdicts, not similarity scores) · #3 explainability (clause + evidence + confidence + fix note, evidence labelled by how it was found, and a fully browsable Rule Library) · #6 **deterministic + fuzzy unified** — the keyword groups are the deterministic rules-as-code half and the TF-IDF retriever is the fuzzy semantic half, fused per clause under one verdict with an explicit precedence rule.

**Not yet implemented** (Review-II scope): gap #4, the CDSCO change-sync watcher, and gap #5's domain fine-tuning. The schema is ready for #4 — clauses are rows, so an amendment is an update plus a re-run.

---

## Assumptions and notes

- **Nebulizer particular standard — corrected.** The project brief names ISO 80601-2-84, but that standard covers *emergency and transport ventilators*, not nebulizers. It has been replaced with **ISO 27427** (nebulizing systems and components), with **EN 13544-1 Annex CC** as the operative aerosol-performance method the clause actually tests against. If you need the brief's original wording for submission consistency, change `particularStandard` for the nebulizer entry in `packages/db/prisma/seed.ts` and re-run `npm run db:reset`.
- **Clause text** is written to reflect standard Indian MDR-2017 import-documentation practice at the level of detail a reviewer checks. It is a curated teaching subset, not the complete MDR-2017 corpus, and the tool's output is a review aid — not a regulatory determination.
- **Auth** is deliberately omitted: this runs on the reviewer's own machine. The API already attaches a reviewer identity to every request (`req.reviewer` in `apps/api/src/index.ts`), so adding real authentication means replacing one middleware, not touching the routes.
- **Scanned PDFs** are rejected with a clear message rather than silently producing an empty audit — the layout-aware OCR stage described in the project proposal is not implemented here.
- **SQLite** keeps setup to zero. The schema is Postgres-compatible: switch `provider` in `packages/db/prisma/schema.prisma` to `postgresql`, point `url` at `env("DATABASE_URL")` and run `prisma migrate dev`. No model changes needed.
- **Model.** The brief named `claude-sonnet-4-6`; the default here is `claude-sonnet-5`, the current generation of that tier. Override with `ANTHROPIC_MODEL` in `.env`.

---

## Commands

| Command | Effect |
|---|---|
| `npm run dev` | Provision if needed, then start API + web |
| `npm run db:reset` | Drop and re-seed the rule library (also clears audits) |
| `npm run db:studio` | Open Prisma Studio to browse the database |
| `npm run build` | Production build of the frontend |
