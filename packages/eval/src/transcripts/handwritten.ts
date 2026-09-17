import type { WordingRelationship } from "../fixtures/types";

/**
 * Hand-written model responses, keyed by clause code and wording relationship.
 * They are written as a careful reviewer-model would answer — verbatim quotes
 * from the passage, specific fix notes — and are recorded to
 * fixtures/llm-transcripts with source "hand-written" so replay never confuses
 * them with a live recording.
 *
 * Coverage is deliberately partial (four clauses × three passages). A full
 * replay set is produced by one `npm run eval -- --matcher=llm --live` run,
 * which records every response it receives.
 */
export type HandwrittenResponse = {
  clauseCode: string;
  wordingRelationship: WordingRelationship;
  response: { verdict: string; confidence: number; evidence_snippet: string; fix_note: string };
};

export const HANDWRITTEN: HandwrittenResponse[] = [
  // ---------------------------------------------------------------- ISO 13485
  {
    clauseCode: "CORE-ISO13485",
    wordingRelationship: "SATISFIED_LITERAL",
    response: {
      verdict: "PASS",
      confidence: 0.95,
      evidence_snippet: "ISO 13485:2016 certificate number DE-QMS-2022-77413 issued by TÜV SÜD Product Service GmbH. Scope of certification: design, development and manufacture of non-invasive patient monitoring equipment including pulse oximeters. Date of issue 11 April 2022; valid until 10 April 2026.",
      fix_note: "",
    },
  },
  {
    clauseCode: "CORE-ISO13485",
    wordingRelationship: "SATISFIED_PARAPHRASE",
    response: {
      verdict: "PASS",
      confidence: 0.88,
      evidence_snippet: "The quality management certificate issued to the Fürstenfeldbruck plant by the notified body TÜV SÜD under EN ISO 13485 remains in force until 31 March 2028 (registration Q1 20 22 77413 R1). Its scope covers the design and production of non-invasive physiological monitors",
      fix_note: "",
    },
  },
  {
    clauseCode: "CORE-ISO13485",
    wordingRelationship: "NOT_SATISFIED_DISTRACTOR",
    response: {
      verdict: "MINOR_IMPROVEMENT",
      confidence: 0.92,
      evidence_snippet: "Date of issue 12 April 2019; valid until 11 April 2022. Recertification audit has been scheduled and the renewed certificate will be forwarded to the licensing authority upon receipt.",
      fix_note: "The ISO 13485:2016 certificate DE-QMS-2019-51120 expired on 11 April 2022. Provide the current, unexpired certificate covering the manufacturing site and this device category, or the recertification certificate once issued.",
    },
  },

  // ---------------------------------------------------------------- Free Sale Certificate
  {
    clauseCode: "CORE-FSC",
    wordingRelationship: "SATISFIED_LITERAL",
    response: {
      verdict: "PASS",
      confidence: 0.96,
      evidence_snippet: "A Free Sale Certificate for the FS-200 Fingertip Pulse Oximeter was issued by the Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM), the national regulatory authority of Germany, the country of origin, under certificate number 2023/FSC/88214 dated 05 November 2023",
      fix_note: "",
    },
  },
  {
    clauseCode: "CORE-FSC",
    wordingRelationship: "SATISFIED_PARAPHRASE",
    response: {
      verdict: "PASS",
      confidence: 0.85,
      evidence_snippet: "Confirmation that the FS-200 may be lawfully placed on the German market was obtained from BfArM, the federal medicines and medical devices regulator, on 05 November 2023 (their reference 2023/FSC/88214).",
      fix_note: "",
    },
  },
  {
    clauseCode: "CORE-FSC",
    wordingRelationship: "NOT_SATISFIED_DISTRACTOR",
    response: {
      verdict: "REJECT",
      confidence: 0.93,
      evidence_snippet: "In lieu of a Free Sale Certificate from the country of origin, the manufacturer encloses a Declaration of Conformity signed by its Quality Director",
      fix_note: "A manufacturer's Declaration of Conformity is a self-declaration and does not satisfy Rule 35(2). Obtain and submit a Free Sale Certificate or Certificate to Foreign Government for the FS-200 issued by BfArM (or another national regulatory authority of the country of origin), valid on the date of application.",
    },
  },

  // ---------------------------------------------------------------- SpO2 accuracy
  {
    clauseCode: "OXI-SPO2-ACCURACY",
    wordingRelationship: "SATISFIED_LITERAL",
    response: {
      verdict: "PASS",
      confidence: 0.97,
      evidence_snippet: "A controlled desaturation study per ISO 80601-2-61:2017 clause 201.12.1.101 was conducted at the University of California San Francisco Hypoxia Laboratory in 12 healthy adult volunteers, yielding 216 paired data points against a Radiometer ABL90 CO-oximeter over the saturation range 70 to 100 %. ... Result: SpO2 accuracy root mean square (ARMS) 1.9 % over 70–100 %.",
      fix_note: "",
    },
  },
  {
    clauseCode: "OXI-SPO2-ACCURACY",
    wordingRelationship: "SATISFIED_PARAPHRASE",
    response: {
      verdict: "PASS",
      confidence: 0.86,
      evidence_snippet: "twelve healthy adults — four each of dark, medium and light skin tone — were brought stepwise down to 70 % oxygen saturation while arterial blood samples were analysed on a Radiometer ABL90. Across 216 paired readings the device's root-mean-square error against the blood-gas reference was 1.9 %.",
      fix_note: "",
    },
  },
  {
    clauseCode: "OXI-SPO2-ACCURACY",
    wordingRelationship: "NOT_SATISFIED_DISTRACTOR",
    response: {
      verdict: "REJECT",
      confidence: 0.94,
      evidence_snippet: "SpO2 accuracy was verified in accordance with ISO 80601-2-61:2017 using a Fluke Biomedical ProSim 8 SpO2 simulator across the saturation range 70 to 100 %",
      fix_note: "A bench SpO2 simulator is not the controlled human desaturation study against a CO-oximeter reference that ISO 80601-2-61 clause 201.12.1.101 requires, and the clause states that simulator data alone does not satisfy it. Submit the clinical desaturation study report with ARMS, subject count, data pairs, pigmentation distribution and Bland-Altman analysis.",
    },
  },

  // ---------------------------------------------------------------- Nebulizer aerosol
  {
    clauseCode: "NEB-AEROSOL",
    wordingRelationship: "SATISFIED_LITERAL",
    response: {
      verdict: "PASS",
      confidence: 0.96,
      evidence_snippet: "using a Next Generation cascade impactor at 15 L/min: aerosol output 1.18 mL, aerosol output rate 0.26 mL/min, mass median aerodynamic diameter (MMAD) 3.8 µm, geometric standard deviation 2.1, respirable fraction (below 5 µm) 68 %. Test medication 0.9 % sodium chloride with 2.5 mL fill volume",
      fix_note: "",
    },
  },
  {
    clauseCode: "NEB-AEROSOL",
    wordingRelationship: "SATISFIED_PARAPHRASE",
    response: {
      verdict: "PASS",
      confidence: 0.84,
      evidence_snippet: "droplet distribution measured by cascade impactor, mass median 3.8 micron with a spread factor of 2.1, 68 % of the delivered mass in droplets small enough to reach the lower airways, 1.18 mL delivered in total at 0.26 mL/min",
      fix_note: "",
    },
  },
  {
    clauseCode: "NEB-AEROSOL",
    wordingRelationship: "NOT_SATISFIED_DISTRACTOR",
    response: {
      verdict: "MINOR_IMPROVEMENT",
      confidence: 0.83,
      evidence_snippet: "Particle size was determined by laser diffraction (Malvern Spraytec) at the manufacturer's laboratory; MMAD 3.5 µm. Fill volume and test medication were as per standard practice.",
      fix_note: "EN 13544-1 Annex CC specifies cascade impaction, not laser diffraction. Provide the impactor-derived aerosol output, output rate, MMAD, geometric standard deviation and respirable fraction, and state the test medication, fill volume and flow rate used, since the declared performance is valid only for those conditions.",
    },
  },
];
