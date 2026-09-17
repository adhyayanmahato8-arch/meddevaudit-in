import { rec, type EvalRecord } from "./types";

export const THERMOMETER: EvalRecord[] = [
  // ---------------------------------------------------------------- accuracy
  rec(
    "THERM-ACCURACY",
    "SATISFIED_LITERAL",
    "PASS",
    `6.1 Performance. Test report TR-80601-2-56-31177 (SGS Fimko, Helsinki, ILAC-accredited, 8 May 2023) to IEC 80601-2-56:2017+A1 covers the DT-10 clinical thermometer. Laboratory accuracy in a stirred water bath was ±0.1 °C across the measurement range 35.0 to 42.0 °C and ±0.2 °C from 32.0 to 34.9 °C and 42.1 to 43.0 °C. Response time to within 0.1 °C of final reading: 8 s (predictive mode). Clinical accuracy study (n = 112, axillary site, reference: calibrated mercury-in-glass): clinical bias −0.04 °C, limits of agreement −0.28 to +0.20 °C, clinical repeatability 0.09 °C. Report at Annex 11.`,
    `Report number and accredited laboratory, laboratory accuracy over the declared range, the range itself, response time, and clinical bias and limits of agreement from a human study — every element is present.`,
  ),
  rec(
    "THERM-ACCURACY",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 11 holds the independent laboratory's verification of the DT-10 against the particular standard for clinical electrical thermometers (SGS Fimko, reference 31177, May 2023). In a stirred bath the instrument read within one-tenth of a degree of the reference across the fever band (35.0–42.0 °C) and within two-tenths at the extremes down to 32.0 and up to 43.0 °C; a stable predictive reading was reached in eight seconds. In 112 patients measured under the arm against a calibrated glass reference, the mean offset was −0.04 °C with 95 % of paired differences lying between −0.28 and +0.20 °C.`,
    `Same evidence — accredited report, lab accuracy and range, response time, clinical bias and limits of agreement — without "IEC 80601-2-56", "accuracy", "±0.1", "test report" or "clinical accuracy".`,
  ),
  rec(
    "THERM-ACCURACY",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `6.1 Performance. The DT-10 has been tested to IEC 80601-2-56:2017 for clinical thermometer accuracy. Laboratory accuracy: ±0.1 °C over the measurement range 35.0 to 42.0 °C, ±0.2 °C outside that range; response time 8 s. Test report TR-80601-2-56-31177 at Annex 11. Clinical accuracy has been established by the manufacturer's use of a temperature-simulating calibration block (Fluke 9142) across the range, which reproduces patient conditions.`,
    `The laboratory accuracy is real, but the clinical bias and limits of agreement that the standard requires from human subjects have been replaced by a calibration-block bench test. Bench data substituted for the clinical evidence the clause demands — REJECT.`,
  ),

  // ---------------------------------------------------------------- site / mode
  rec(
    "THERM-SITE-MODE",
    "SATISFIED_LITERAL",
    "PASS",
    `8.5 Label and IFU — measurement site. The label and the Instructions for Use (section 3) state that the DT-10 is validated for axillary and oral measurement, operates in adjusted mode, and reports a temperature adjusted to the oral reference body site. The declared site-specific measurement uncertainty is ±0.2 °C (axillary) and ±0.1 °C (oral). Rectal and tympanic use are stated as not validated.`,
    `Validated sites, mode of operation, the reference site for adjusted mode and the site-specific uncertainty are all declared on label and IFU.`,
  ),
  rec(
    "THERM-SITE-MODE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The packaging and section 3 of the user manual make clear where on the body the DT-10 has been proven to work — under the arm and under the tongue — and explain that the displayed figure is not the raw probe reading but has been converted to the value that would be expected in the mouth. The stated tolerance is two-tenths of a degree under the arm and one-tenth in the mouth. Use in the ear or rectum has not been evaluated and is advised against.`,
    `Sites (axillary/oral), the adjusted-to-oral nature of the reading, site-specific tolerance and non-validated sites are all conveyed — without "oral", "axillary", "adjusted mode", "mode of operation", "IFU" or "label".`,
  ),
  rec(
    "THERM-SITE-MODE",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.5 Label and IFU — measurement site. The DT-10 is a digital thermometer for measuring body temperature and may be used orally, axillary or rectally, as described in the Instructions for Use. Measurement accuracy is ±0.1 °C. Mode of operation and the reference body site are as per IEC 80601-2-56. The label carries the wording "Digital clinical thermometer — body temperature".`,
    `Sites are listed, but the mode of operation and reference site are deferred to "as per the standard" rather than declared, and the clinical validation in Annex 11 covered only the axillary site — rectal use is claimed without validation, and no site-specific uncertainty is given. Addressed but materially incomplete — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- battery
  rec(
    "THERM-BATTERY",
    "SATISFIED_LITERAL",
    "PASS",
    `5.3 Internal power source. The DT-10 is internally powered by one LR41 alkaline button cell, 1.5 V, 32 mAh. The cell manufacturer's IEC 62133-2:2017 certificate (Energizer, certificate CB-DK-15221, Annex 7B) is enclosed. Section 15.4.3 of the IEC 60601-1 report (TR-60601-1-31160) assesses the internal electrical power source, including protection against excessive temperature and electrolyte leakage. Because the cell is a button cell and the device may be used on children, the IFU carries the button-cell ingestion warning in section 2.`,
    `Battery type and rating, the cell's IEC 62133-2 certificate, the 60601-1 assessment of the power source, and the ingestion warning are all present.`,
  ),
  rec(
    "THERM-BATTERY",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Power comes from a single 1.5 V LR41 alkaline button-type cell. The cell supplier's third-party conformity certificate for the portable sealed cell safety standard (Energizer, CB-DK-15221, Annex 7B) is enclosed, and the medical electrical safety report at Annex 7 (section 15.4.3) evaluates the on-board supply for over-temperature and leakage. Since a small child could swallow the cell, the user manual's second section warns about that hazard and what to do if it happens.`,
    `Cell type, its supplier certificate to the cell safety standard, the 60601-1 evaluation and the swallowing warning — without "IEC 62133", "battery safety", "battery" or "test report".`,
  ),
  rec(
    "THERM-BATTERY",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `5.3 Internal power source. The DT-10 is internally powered by one LR41 1.5 V alkaline button cell supplied by a reputable manufacturer. The cell is CE marked and RoHS compliant. Battery safety is assured by the cell's compliance with IEC 62133, as stated in the supplier's product datasheet (Annex 7B). The cell is not user-accessible without a tool, so no ingestion warning is required.`,
    `A datasheet asserting compliance is not a certificate; the IEC 60601-1 power-source assessment is absent; and the ingestion-warning exemption is asserted without evidence that the compartment is tool-secured. The required certificate and assessment are missing — REJECT.`,
  ),

  // ---------------------------------------------------------------- biocompat
  rec(
    "THERM-BIOCOMPAT",
    "SATISFIED_LITERAL",
    "PASS",
    `7.1 Biocompatibility. The probe tip (stainless steel 304) and the single-use polyethylene probe cover are surface-contacting devices with limited (≤24 h) contact duration. The biological evaluation plan BEP-DT10-01 and biological evaluation report BER-DT10-02 (Annex 12) are per ISO 10993-1:2018 and include cytotoxicity (ISO 10993-5, MTT, L929: non-cytotoxic), skin irritation (ISO 10993-23, reconstructed human epidermis: non-irritant) and skin sensitisation (ISO 10993-10, GPMT: non-sensitiser), performed by Nelson Labs, report numbers 1240221-1 to -3.`,
    `Contact classification, plan and report to ISO 10993-1, cytotoxicity, irritation and sensitisation data from a named laboratory — fully met.`,
  ),
  rec(
    "THERM-BIOCOMPAT",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 12 contains the plan and the report of the biological safety assessment of the parts that touch the patient — the steel probe tip and its disposable polyethylene sheath — classed as intact-skin contact for under a day. Nelson Labs (reports 1240221-1 to -3) found no cell toxicity in the mouse-fibroblast assay, no reaction in the reconstructed-skin model, and no allergic response in the guinea-pig maximisation test.`,
    `Same evidence — classification, plan/report, the three endpoints with methods and outcomes — without "ISO 10993", "biocompatibility", "cytotoxicity", "irritation" or "sensitisation".`,
  ),
  rec(
    "THERM-BIOCOMPAT",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `7.1 Biocompatibility. The probe tip is manufactured from medical-grade stainless steel 304 and the probe cover from medical-grade polyethylene; both materials are widely used in clinical thermometers and are biocompatible. The materials comply with ISO 10993-1 and are suitable for skin contact. A biological evaluation was therefore not considered necessary. Material certificates from the suppliers are at Annex 12.`,
    `"Medical-grade" and "widely used" are not a biological evaluation and no predicate device or data is cited for an equivalence argument. The clause requires a plan and report with cytotoxicity, irritation and sensitisation data or a justified equivalence — neither is provided — REJECT.`,
  ),
];

export const OXIMETER: EvalRecord[] = [
  // ---------------------------------------------------------------- SpO2 accuracy
  rec(
    "OXI-SPO2-ACCURACY",
    "SATISFIED_LITERAL",
    "PASS",
    `6.1 Clinical accuracy (SpO2). A controlled desaturation study per ISO 80601-2-61:2017 clause 201.12.1.101 was conducted at the University of California San Francisco Hypoxia Laboratory in 12 healthy adult volunteers, yielding 216 paired data points against a Radiometer ABL90 CO-oximeter over the saturation range 70 to 100 %. The cohort comprised 4 subjects with dark (Fitzpatrick V–VI), 4 intermediate and 4 light pigmentation. Result: SpO2 accuracy root mean square (ARMS) 1.9 % over 70–100 %. Bland-Altman analysis (Annex 6A): mean bias −0.3 %, limits of agreement −4.1 to +3.5 %.`,
    `Desaturation study, CO-oximeter reference, ARMS with numeric value over the declared range, subjects and data pairs, pigmentation distribution and Bland-Altman analysis — complete.`,
  ),
  rec(
    "OXI-SPO2-ACCURACY",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 6 reports the human hypoxia trial run at the UCSF laboratory in which twelve healthy adults — four each of dark, medium and light skin tone — were brought stepwise down to 70 % oxygen saturation while arterial blood samples were analysed on a Radiometer ABL90. Across 216 paired readings the device's root-mean-square error against the blood-gas reference was 1.9 %. The agreement plot at Annex 6A shows a mean offset of −0.3 % with 95 % limits from −4.1 to +3.5 %.`,
    `Human hypoxia trial, blood-gas reference, RMS error (= ARMS) with value and range, n and pairs, pigmentation, agreement analysis — without "ISO 80601-2-61", "ARMS", "desaturation study", "CO-oximeter" or "volunteers".`,
  ),
  rec(
    "OXI-SPO2-ACCURACY",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `6.1 Clinical accuracy (SpO2). SpO2 accuracy was verified in accordance with ISO 80601-2-61:2017 using a Fluke Biomedical ProSim 8 SpO2 simulator across the saturation range 70 to 100 % in 2 % steps, with 30 readings per step (480 data points). Accuracy root mean square (ARMS) against the simulator setting: 1.2 %. The manufacturer considers the simulator method to be equivalent to a volunteer desaturation study because the simulator reproduces the optical characteristics of desaturated tissue; Bland-Altman analysis at Annex 6A.`,
    `Every keyword is present and the ARMS value looks excellent, but the reference is a bench simulator, which the clause states explicitly does not satisfy the requirement. Weaker evidence substituted for the clinical study — REJECT.`,
  ),

  // ---------------------------------------------------------------- label accuracy / probes
  rec(
    "OXI-LBL-ACCURACY",
    "SATISFIED_LITERAL",
    "PASS",
    `8.6 Label and IFU — declared performance. The label and IFU section 9 state: SpO2 accuracy ARMS 1.9 % over the saturation range 70–100 %; pulse rate range 30–250 bpm with pulse rate accuracy ±2 bpm; emitter wavelengths 660 nm and 905 nm with maximum optical output power below 15 mW; and the list of compatible sensors validated with this monitor — FS-ADT-01 (adult) and FS-PED-01 (paediatric). The IFU states that the ARMS figure is a statistical measure and is not the measurement uncertainty of an individual reading.`,
    `Declared ARMS and range, pulse-rate range and accuracy, wavelengths and output power, an explicit compatible-probe list, and the individual-reading caveat — all present.`,
  ),
  rec(
    "OXI-LBL-ACCURACY",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Section 9 of the manual and the carton disclose the device's performance figures: a root-mean-square error of 1.9 % for oxygen saturation between 70 and 100 %; heart-rate readings from 30 to 250 per minute within ±2; light sources at 660 and 905 nanometres emitting under 15 milliwatts; and the two finger sensors — FS-ADT-01 for adults, FS-PED-01 for children — that were used in validation and are the only ones approved for use. The manual explains that the 1.9 % figure describes population-level performance, not the error of any single measurement.`,
    `All disclosures present — without "ARMS", "accuracy", "pulse rate", "bpm", "wavelength", "probe" or "compatible sensor".`,
  ),
  rec(
    "OXI-LBL-ACCURACY",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.6 Label and IFU — declared performance. The label and IFU state: SpO2 accuracy ARMS 1.9 % (70–100 %); pulse rate range 30–250 bpm, accuracy ±2 bpm; wavelengths 660 nm / 905 nm, maximum optical output power below 15 mW. The FS-200 is compatible with standard SpO2 finger sensors with the industry-standard 7-pin connector, including sensors from third-party suppliers. The ARMS figure is not the measurement uncertainty of an individual reading.`,
    `Everything is declared except the specific list of validated probe models — "standard sensors including third-party" is the opposite of a validated list, and using an unvalidated probe voids the accuracy claim. Present but with the key list missing — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- alarms
  rec(
    "OXI-ALARM",
    "SATISFIED_LITERAL",
    "PASS",
    `5.4 Alarm system. The FS-200 provides physiological alarms (low SpO2 — high priority; low and high pulse rate — medium priority) and technical alarms (low battery, probe off — low priority). Conformity with IEC 60601-1-8:2006 + A1:2012 + A2:2020 is demonstrated by test report TR-ALM-22903 (TÜV SÜD, Annex 7C), which verifies alarm condition priorities, audible alarm signal characteristics (bursts, pitch, sound pressure) and visual alarm signal characteristics, alarm limit setting range and default limits, the alarm-off and audio-paused indications, and an alarm system delay below 10 s.`,
    `Alarm conditions and priorities, the report to IEC 60601-1-8, signal characteristics, limits/defaults, off/paused indications and delay — all present.`,
  ),
  rec(
    "OXI-ALARM",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The monitor warns the user when saturation falls too low (top urgency), when the heart rate leaves the set band (intermediate urgency), and when the battery is low or the finger clip has come off (lowest urgency). Annex 7C is the independent laboratory's verification (TÜV SÜD, reference TR-ALM-22903) against the collateral standard for medical warning systems: the tone patterns and loudness, the lamp colours and flash rates, the range and factory settings of the adjustable limits, the indicators shown when warnings are switched off or muted, and the lag between the event and the warning (under ten seconds) were all confirmed.`,
    `Same evidence in plain words — without "IEC 60601-1-8", "alarm system", "alarm limit", "alarm priority", "high/medium priority", "audible", "visual" or "alarm signal".`,
  ),
  rec(
    "OXI-ALARM",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `5.4 Alarm system. The FS-200 provides audible and visual alarms for low SpO2, high and low pulse rate, low battery and probe-off conditions, with user-adjustable alarm limits and default limits set at the factory. The alarm system has been designed with reference to IEC 60601-1-8, which is included in the list of applied standards (section 4). Alarm functions were verified during software validation (section 7).`,
    `The device clearly has alarms, and the collateral standard is cited — but only in a list of applied standards, with verification folded into generic "software validation". There is no alarm-system test report, no priorities, no signal characteristics, no delay figure. A standard in a reference list with no report behind it — REJECT.`,
  ),

  // ---------------------------------------------------------------- software
  rec(
    "OXI-SOFTWARE",
    "SATISFIED_LITERAL",
    "PASS",
    `7. Software. The embedded firmware is developed under a lifecycle process conforming to IEC 62304:2006 + A1:2015. Software safety classification: Class B, justified because a software failure could contribute to a hazardous situation (delayed or erroneous saturation reading) leading to non-serious injury. The documentation set (Annex 10) comprises the software development plan SDP-FS200, software requirements specification SRS-FS200 rev 4, software architecture document, unit and integration verification records, the software validation report SVVR-FS200, the known-anomaly list with residual anomaly justification, and the SOUP inventory (FreeRTOS 10.4.3, CMSIS-DSP 1.9.0) with its risk assessment.`,
    `Classification with justification, and every listed document including anomaly list and SOUP inventory with risk assessment — complete.`,
  ),
  rec(
    "OXI-SOFTWARE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 10 documents how the firmware was engineered under the medical device software process standard. Because a fault could delay or distort the displayed saturation and thereby cause minor harm, the firmware is placed in the middle of the three safety tiers, and that placement is argued in writing. The set includes the engineering plan, the numbered list of what the code must do (revision 4), the structural design, the records of testing each module and the assembled whole, the final confirmation report, the register of open defects with an explanation of why each is tolerable, and the inventory of third-party components (FreeRTOS 10.4.3, CMSIS-DSP 1.9.0) with the hazards each might introduce.`,
    `All elements described — without "IEC 62304", "software safety classification", "Class B", "verification", "validation", "SOUP" or "anomaly".`,
  ),
  rec(
    "OXI-SOFTWARE",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `7. Software. The embedded firmware was developed under IEC 62304:2006 + A1:2015. Software safety classification: Class A. The documentation set (Annex 10) comprises the software development plan, software requirements specification rev 4, architecture document, verification and validation reports, and the SOUP inventory (FreeRTOS 10.4.3, CMSIS-DSP 1.9.0) with risk assessment. No known anomalies remain open.`,
    `The documentation set is nearly complete, but the safety classification is Class A with no justification — for a monitor whose software failure could produce a hazardous under-reading, Class A is implausible and the clause requires the classification to be justified. Present but a required justification is missing — MINOR_IMPROVEMENT.`,
  ),
];
