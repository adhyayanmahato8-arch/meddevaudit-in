import { CORE } from "./core";
import { THERMOMETER, OXIMETER } from "./thermometer";
import { BP, ECG, NEBULIZER } from "./bp-ecg-neb";
import type { EvalRecord } from "./types";

export * from "./types";

/** Every annotated passage, in authoring order. */
export const ALL_RECORDS: EvalRecord[] = [...CORE, ...THERMOMETER, ...OXIMETER, ...BP, ...ECG, ...NEBULIZER];

export function recordsFor(clauseCode: string): EvalRecord[] {
  return ALL_RECORDS.filter((r) => r.clauseCode === clauseCode);
}
