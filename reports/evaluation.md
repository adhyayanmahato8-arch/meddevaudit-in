# MedDevAudit-IN — evaluation report

- **Matcher:** hybrid (BM25 + sentence embeddings, keyword coverage)
- **Generated:** 2026-09-17T06:33:21.798Z (147.8 s)
- **Split:** clause-level, stratified by category, seed 42 — calibration 19 clauses / 57 passages; held-out 14 clauses / 42 passages
- **Held-out clauses:** BP-CUFF-PRESSURE, BP-OVERPRESSURE, CORE-DMF, CORE-FSC, CORE-IEC60601-1, CORE-IFU, CORE-ISO13485, CORE-LBL-BILINGUAL, CORE-LBL-MFR, ECG-ALGORITHM, NEB-GASPATH-BIOCOMPAT, OXI-ALARM, OXI-SPO2-ACCURACY, THERM-SITE-MODE

> All figures in *Held-out results* are computed on the held-out split only. Nothing was tuned on it.

## Calibration (calibration split only)

Objective: maximise recall on non-compliance (REJECT ∪ MINOR_IMPROVEMENT) subject to non-compliance precision ≥ **80.0%**; ties broken by macro-F1, then accuracy, then the lower softening threshold.

- Grid: 96 configurations (covPass × tauPass × tauSoften)
- Meeting the floor: **0** — **the floor was not met by any configuration.** The primary rule then degenerates to flagging everything, so the stated fallback rule was applied: *max non-compliance F1 subject to literal-PASS recall ≥ 80.0%*. This is a failure to reach the target and is reported as such.
- For comparison, the unconstrained max-recall point (`covPass=0.8`, `tauPass=0`, `tauSoften=0.5`) gives NC recall 26.3% at NC precision 23.8% — but PASS recall of only 57.9%, i.e. it flags almost everything and is not a usable operating point.
- Chosen: `covPass=0.8`, `tauPass=0`, `tauSoften=0.5`, `tauContext=0.2`
- On calibration: NC recall 26.3%, NC precision 23.8%, accuracy 40.4%, macro-F1 22.3%

### Recall / precision frontier (calibration split)

The best non-compliance precision any configuration reaches while holding recall at or above the stated level. This is the whole trade-off the sweep can offer; the floor is drawn against it.

| recall ≥ | best precision | config (covPass / tauPass / tauSoften) |
|---|---|---|

| rank | covPass | tauPass | tauSoften | NC recall | NC precision | accuracy | macro-F1 |
|---|---|---|---|---|---|---|---|
| 1 | 0.8 | 0 | 0.5 | 26.3% | 23.8% | 40.4% | 22.3% |
| 2 | 0.8 | 0 | 0.55 | 26.3% | 23.8% | 40.4% | 22.3% |
| 3 | 0.8 | 0 | 0.6 | 26.3% | 23.8% | 40.4% | 22.3% |
| 4 | 0.8 | 0 | 0.65 | 26.3% | 23.8% | 40.4% | 22.3% |
| 5 | 0.8 | 0 | 0.7 | 26.3% | 23.8% | 40.4% | 22.3% |

## Held-out results (n = 42)

| metric | value |
|---|---|
| Accuracy (3-class) | **42.9%** |
| Macro-F1 (3-class) | 24.3% |
| Non-compliance recall | **35.7%** (5/14) |
| Non-compliance precision | **31.3%** (5/16) |
| Non-compliance F1 | 33.3% |
| Missed non-compliance (false PASS) | **9** |
| False alarms (compliant flagged) | 11 |

### Confusion matrix (rows = expected, columns = predicted)

| expected \ predicted | PASS | MINOR_IMPROVEMENT | REJECT |
|---|---|---|---|
| **PASS** | 17 | 7 | 4 |
| **MINOR_IMPROVEMENT** | 7 | 1 | 0 |
| **REJECT** | 2 | 4 | 0 |

### Per verdict class

| class | precision | recall | F1 | support |
|---|---|---|---|---|
| PASS | 65.4% | 60.7% | 63.0% | 28 |
| MINOR_IMPROVEMENT | 8.3% | 12.5% | 10.0% | 8 |
| REJECT | 0.0% | 0.0% | 0.0% | 6 |

### Per wording relationship

| relationship | n | accuracy | of which predicted PASS | predicted MINOR | predicted REJECT |
|---|---|---|---|---|---|
| SATISFIED_LITERAL | 14 | 92.9% | 13 | 1 | 0 |
| SATISFIED_PARAPHRASE | 14 | 28.6% | 4 | 6 | 4 |
| NOT_SATISFIED_DISTRACTOR | 14 | 7.1% | 9 | 5 | 0 |

### Per clause category

| category | n | accuracy | NC recall | NC precision | NC support |
|---|---|---|---|---|---|
| Biocompatibility | 3 | 33.3% | 100.0% | 50.0% | 1 |
| Device Master File | 3 | 33.3% | 0.0% | 0.0% | 1 |
| Instructions for Use | 3 | 33.3% | 0.0% | 0.0% | 1 |
| Labelling | 9 | 44.4% | 0.0% | 0.0% | 3 |
| Licensing & Registration | 3 | 33.3% | 0.0% | 0.0% | 1 |
| Performance Testing | 6 | 50.0% | 0.0% | 0.0% | 2 |
| Quality Management | 3 | 66.7% | 0.0% | — | 1 |
| Safety Testing | 9 | 44.4% | 100.0% | 50.0% | 3 |
| Software Lifecycle | 3 | 33.3% | 100.0% | 50.0% | 1 |

### Held-out misses

| clause | relationship | expected | predicted | coverage | retrieval |
|---|---|---|---|---|---|
| BP-CUFF-PRESSURE | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.56 |
| BP-OVERPRESSURE | SATISFIED_LITERAL | PASS | MINOR_IMPROVEMENT | 0.67 | 0.56 |
| BP-OVERPRESSURE | SATISFIED_PARAPHRASE | PASS | REJECT | 0.00 | 0.40 |
| CORE-DMF | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.75 | 0.34 |
| CORE-DMF | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.70 |
| CORE-FSC | SATISFIED_PARAPHRASE | PASS | REJECT | 0.00 | 0.30 |
| CORE-FSC | NOT_SATISFIED_DISTRACTOR | REJECT | PASS | 1.00 | 0.45 |
| CORE-IEC60601-1 | NOT_SATISFIED_DISTRACTOR | REJECT | MINOR_IMPROVEMENT | 0.67 | 0.52 |
| CORE-IFU | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.75 | 0.48 |
| CORE-IFU | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.46 |
| CORE-ISO13485 | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.54 |
| CORE-LBL-BILINGUAL | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.67 | 0.46 |
| CORE-LBL-BILINGUAL | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.57 |
| CORE-LBL-MFR | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.43 |
| ECG-ALGORITHM | SATISFIED_PARAPHRASE | PASS | REJECT | 0.00 | 0.40 |
| ECG-ALGORITHM | NOT_SATISFIED_DISTRACTOR | REJECT | MINOR_IMPROVEMENT | 0.75 | 0.60 |
| NEB-GASPATH-BIOCOMPAT | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.33 | 0.43 |
| NEB-GASPATH-BIOCOMPAT | NOT_SATISFIED_DISTRACTOR | REJECT | MINOR_IMPROVEMENT | 0.67 | 0.44 |
| OXI-ALARM | SATISFIED_PARAPHRASE | PASS | REJECT | 0.00 | 0.37 |
| OXI-ALARM | NOT_SATISFIED_DISTRACTOR | REJECT | MINOR_IMPROVEMENT | 0.67 | 0.46 |
| OXI-SPO2-ACCURACY | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.50 | 0.41 |
| OXI-SPO2-ACCURACY | NOT_SATISFIED_DISTRACTOR | REJECT | PASS | 1.00 | 0.61 |
| THERM-SITE-MODE | SATISFIED_PARAPHRASE | PASS | MINOR_IMPROVEMENT | 0.67 | 0.41 |
| THERM-SITE-MODE | NOT_SATISFIED_DISTRACTOR | MINOR_IMPROVEMENT | PASS | 1.00 | 0.52 |

## Whole-dossier fixtures (system-level check — NOT held-out)

These dossiers are assembled from the same passage pool and therefore contain calibration passages. They test the end-to-end path (multi-passage retrieval, overall-result rule) rather than generalisation.

| dossier | expected overall | predicted overall | clause accuracy | NC recall | NC precision | clauses |
|---|---|---|---|---|---|---|
| bp-monitor-distractor-heavy | REJECT | **MINOR_IMPROVEMENT ✗** | 17.6% | 35.3% | 100.0% | 17 |
| bp-monitor-sparse | REJECT | REJECT ✓ | 64.7% | 100.0% | 91.7% | 17 |
| ecg-paraphrase-two-rejects | REJECT | REJECT ✓ | 11.8% | 50.0% | 7.1% | 17 |
| nebulizer-literal-one-minor | MINOR_IMPROVEMENT | MINOR_IMPROVEMENT ✓ | 88.2% | 0.0% | 0.0% | 17 |
| pulse-oximeter-literal-complete | PASS | **MINOR_IMPROVEMENT ✗** | 94.1% | 0.0% | 0.0% | 17 |
| pulse-oximeter-paraphrase-complete | PASS | **REJECT ✗** | 5.9% | 0.0% | 0.0% | 17 |
| thermometer-mixed-minor | MINOR_IMPROVEMENT | **PASS ✗** | 76.5% | 0.0% | 0.0% | 17 |

Overall result correct on **3/7** dossiers.
