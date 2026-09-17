# MedDevAudit-IN — evaluation report

- **Matcher:** LLM replay (recorded transcripts)
- **Generated:** 2026-09-17T06:28:25.163Z (0.2 s)
- **Split:** clause-level, stratified by category, seed 42 — calibration 19 clauses / 57 passages; held-out 14 clauses / 42 passages
- **Held-out clauses:** BP-CUFF-PRESSURE, BP-OVERPRESSURE, CORE-DMF, CORE-FSC, CORE-IEC60601-1, CORE-IFU, CORE-ISO13485, CORE-LBL-BILINGUAL, CORE-LBL-MFR, ECG-ALGORITHM, NEB-GASPATH-BIOCOMPAT, OXI-ALARM, OXI-SPO2-ACCURACY, THERM-SITE-MODE
- **Transcript coverage:** 9/42 held-out passages answered; 33 had no recorded transcript and are excluded from every figure below

> All figures in *Held-out results* are computed on the held-out split only. Nothing was tuned on it.

## Held-out results (n = 9)

| metric | value |
|---|---|
| Accuracy (3-class) | **100.0%** |
| Macro-F1 (3-class) | 100.0% |
| Non-compliance recall | **100.0%** (3/3) |
| Non-compliance precision | **100.0%** (3/3) |
| Non-compliance F1 | 100.0% |
| Missed non-compliance (false PASS) | **0** |
| False alarms (compliant flagged) | 0 |

### Confusion matrix (rows = expected, columns = predicted)

| expected \ predicted | PASS | MINOR_IMPROVEMENT | REJECT |
|---|---|---|---|
| **PASS** | 6 | 0 | 0 |
| **MINOR_IMPROVEMENT** | 0 | 1 | 0 |
| **REJECT** | 0 | 0 | 2 |

### Per verdict class

| class | precision | recall | F1 | support |
|---|---|---|---|---|
| PASS | 100.0% | 100.0% | 100.0% | 6 |
| MINOR_IMPROVEMENT | 100.0% | 100.0% | 100.0% | 1 |
| REJECT | 100.0% | 100.0% | 100.0% | 2 |

### Per wording relationship

| relationship | n | accuracy | of which predicted PASS | predicted MINOR | predicted REJECT |
|---|---|---|---|---|---|
| SATISFIED_LITERAL | 3 | 100.0% | 3 | 0 | 0 |
| SATISFIED_PARAPHRASE | 3 | 100.0% | 3 | 0 | 0 |
| NOT_SATISFIED_DISTRACTOR | 3 | 100.0% | 0 | 1 | 2 |

### Per clause category

| category | n | accuracy | NC recall | NC precision | NC support |
|---|---|---|---|---|---|
| Licensing & Registration | 3 | 100.0% | 100.0% | 100.0% | 1 |
| Performance Testing | 3 | 100.0% | 100.0% | 100.0% | 1 |
| Quality Management | 3 | 100.0% | 100.0% | 100.0% | 1 |

### Held-out misses

None.

## Whole-dossier fixtures (system-level check — NOT held-out)

These dossiers are assembled from the same passage pool and therefore contain calibration passages. They test the end-to-end path (multi-passage retrieval, overall-result rule) rather than generalisation.

| dossier | expected overall | predicted overall | clause accuracy | NC recall | NC precision | clauses |
|---|---|---|---|---|---|---|
| bp-monitor-distractor-heavy | REJECT | n/a | 0.0% | 0.0% | 0.0% | 0 |
| bp-monitor-sparse | REJECT | n/a | 0.0% | 0.0% | 0.0% | 0 |
| ecg-paraphrase-two-rejects | REJECT | n/a | 0.0% | 0.0% | 0.0% | 0 |
| nebulizer-literal-one-minor | MINOR_IMPROVEMENT | n/a | 0.0% | 0.0% | 0.0% | 0 |
| pulse-oximeter-literal-complete | PASS | n/a | 0.0% | 0.0% | 0.0% | 0 |
| pulse-oximeter-paraphrase-complete | PASS | n/a | 0.0% | 0.0% | 0.0% | 0 |
| thermometer-mixed-minor | MINOR_IMPROVEMENT | n/a | 0.0% | 0.0% | 0.0% | 0 |

Overall result correct on **0/0** dossiers.
