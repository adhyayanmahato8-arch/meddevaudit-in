export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";
export const VERDICTS: Verdict[] = ["PASS", "MINOR_IMPROVEMENT", "REJECT"];

export type Labelled = { expected: Verdict; predicted: Verdict };

export type ClassMetrics = { precision: number; recall: number; f1: number; support: number };

export type Report = {
  n: number;
  accuracy: number;
  confusion: Record<Verdict, Record<Verdict, number>>; // [expected][predicted]
  perClass: Record<Verdict, ClassMetrics>;
  macroF1: number;
  /** Binary: positive = non-compliance (MINOR_IMPROVEMENT or REJECT). */
  nonCompliance: ClassMetrics & { truePositives: number; falsePositives: number; falseNegatives: number };
};

const isNC = (v: Verdict) => v !== "PASS";

export function evaluate(rows: Labelled[]): Report {
  const confusion = {} as Report["confusion"];
  for (const e of VERDICTS) {
    confusion[e] = {} as Record<Verdict, number>;
    for (const p of VERDICTS) confusion[e][p] = 0;
  }
  let correct = 0;
  let tp = 0,
    fp = 0,
    fn = 0;
  for (const row of rows) {
    confusion[row.expected][row.predicted] += 1;
    if (row.expected === row.predicted) correct += 1;
    const e = isNC(row.expected);
    const p = isNC(row.predicted);
    if (e && p) tp += 1;
    else if (!e && p) fp += 1;
    else if (e && !p) fn += 1;
  }

  const perClass = {} as Report["perClass"];
  for (const c of VERDICTS) {
    const ctp = confusion[c][c];
    const support = VERDICTS.reduce((s, p) => s + confusion[c][p], 0);
    const predicted = VERDICTS.reduce((s, e) => s + confusion[e][c], 0);
    const precision = predicted ? ctp / predicted : 0;
    const recall = support ? ctp / support : 0;
    perClass[c] = { precision, recall, f1: f1(precision, recall), support };
  }
  const macroF1 = VERDICTS.reduce((s, c) => s + perClass[c].f1, 0) / VERDICTS.length;

  const ncPrecision = tp + fp ? tp / (tp + fp) : 0;
  const ncRecall = tp + fn ? tp / (tp + fn) : 0;

  return {
    n: rows.length,
    accuracy: rows.length ? correct / rows.length : 0,
    confusion,
    perClass,
    macroF1,
    nonCompliance: {
      precision: ncPrecision,
      recall: ncRecall,
      f1: f1(ncPrecision, ncRecall),
      support: tp + fn,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
    },
  };
}

export function f1(p: number, r: number): number {
  return p + r ? (2 * p * r) / (p + r) : 0;
}

export const pct = (x: number) => `${(x * 100).toFixed(1)}%`;

/** Deterministic PRNG (mulberry32) so splits are reproducible from a seed. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
