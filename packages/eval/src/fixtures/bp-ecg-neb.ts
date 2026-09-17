import { rec, type EvalRecord } from "./types";

export const BP: EvalRecord[] = [
  // ---------------------------------------------------------------- cuff pressure accuracy
  rec(
    "BP-CUFF-PRESSURE",
    "SATISFIED_LITERAL",
    "PASS",
    `6.1 Cuff pressure accuracy. Test report TR-80601-2-30-40211 (Intertek Testing Services, Shanghai, ILAC-accredited, 3 March 2024) to IEC 80601-2-30:2018 demonstrates cuff pressure indication accuracy within ±3 mmHg (or ±2 % of reading, whichever is greater) across the full indicated pressure range 0 to 299 mmHg, at 10 °C, 23 °C and 40 °C and after 48 h conditioning at 85 % RH. Reference manometer: Fluke DPM4, traceable to NIM China. Conclusion: PASS. Report at Annex 11.`,
    `Report number and accredited laboratory, the ±3 mmHg / ±2 % criterion, the full pressure range, environmental and conditioning tests, reference traceability, pass conclusion — complete.`,
  ),
  rec(
    "BP-CUFF-PRESSURE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Intertek's Shanghai laboratory verified the CE-9's static pressure reading against a Fluke DPM4 reference gauge (calibration traceable to the national metrology institute) at every 20 mmHg step from zero to the 299 mmHg ceiling, at cold, room and warm ambient and again after two days in humid conditioning. All readings fell within three millimetres of mercury or two per cent, whichever was the larger allowance. The signed report (40211, March 2024) is at Annex 11.`,
    `Same content — accredited lab, reference traceability, full range, environmental conditioning, the tolerance, pass — without "IEC 80601-2-30", "±3 mmHg", "accuracy", "cuff pressure", "test report" or "calibration".`,
  ),
  rec(
    "BP-CUFF-PRESSURE",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `6.1 Cuff pressure accuracy. The pressure transducer of the CE-9 has been verified against a reference manometer over the range 0 to 299 mmHg at 23 °C and found to be within ±3 mmHg, meeting IEC 80601-2-30. Traceability of the reference manometer: calibration certificate available. Test report GDT-2021-44122 (Guangdong Testing Institute) at Annex 11.`,
    `A report exists and the tolerance is met at room temperature, but the standard's tests at the specified environmental extremes and after temperature/humidity conditioning are absent, and traceability is asserted rather than shown. Present but incomplete — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- clinical validation
  rec(
    "BP-CLINICAL-VALIDATION",
    "SATISFIED_LITERAL",
    "PASS",
    `6.2 Clinical validation. The oscillometric algorithm of the CE-9 was clinically validated against auscultatory reference observers per ISO 81060-2:2018+A1 at Peking University First Hospital (report CV-CE9-2023-02, Annex 12). Protocol: same-arm sequential, two trained observers with a mercury reference. Subjects: 85 (44 female), arm circumference 22–42 cm, with the required distribution of systolic and diastolic pressures. Criterion 1: mean difference −1.2 ± 6.4 mmHg systolic, 0.8 ± 5.1 mmHg diastolic (limit ≤5 ± 8). Criterion 2: SD of averaged per-subject differences 4.7 mmHg systolic, 3.9 mmHg diastolic (limits 6.95 and 6.95). Both criteria met.`,
    `Validation protocol, subject count and cohort distribution, criterion 1 and 2 results for both systolic and diastolic — complete.`,
  ),
  rec(
    "BP-CLINICAL-VALIDATION",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 12 is the hospital study (Peking University First Hospital, CV-CE9-2023-02) in which the CE-9's readings were compared with two trained listeners using a mercury column on the same arm, one after the other, in 85 adults spanning arm sizes from 22 to 42 cm and the required spread of high and low pressures. Averaged over all readings the device read 1.2 mmHg low for the upper figure (scatter 6.4) and 0.8 mmHg high for the lower figure (scatter 5.1); the per-person scatter was 4.7 and 3.9 mmHg. Both of the protocol's acceptance tests were passed.`,
    `Same study elements — reference observers, protocol, n, cohort, both criteria for both pressures — without "ISO 81060-2", "clinical validation", "criterion 1/2", "mean difference", "standard deviation", "systolic", "diastolic", "subjects", "cohort" or "arm circumference".`,
  ),
  rec(
    "BP-CLINICAL-VALIDATION",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `6.2 Clinical validation. The oscillometric algorithm used in the CE-9 is the same mature algorithm platform used in the manufacturer's earlier CE-5 and CE-7 models, which have been sold in more than thirty countries since 2016 with no reported accuracy complaints. Clinical validation of the CE-7 to ISO 81060-2 was performed in 2017 (report CV-CE7-2017-01, held at the manufacturer's site, available on request). Criterion 1 and criterion 2 were met for systolic and diastolic pressure.`,
    `Every keyword is present, but the validation cited belongs to a different device (CE-7), is not enclosed, and equivalence of cuff, pneumatics and firmware is merely asserted. Evidence for the wrong entity, not attached — REJECT.`,
  ),

  // ---------------------------------------------------------------- cuff size / population
  rec(
    "BP-CUFF-SIZE",
    "SATISFIED_LITERAL",
    "PASS",
    `8.7 Label and IFU — cuff and population. The CE-9 is supplied with a standard adult cuff validated for arm circumference 22–32 cm and, optionally, a large adult cuff for 32–42 cm; each cuff is printed with its range and a range index marker. The intended patient population is adults; the IFU states that the device is not validated for paediatric or neonatal use, in pregnancy or pre-eclampsia, or in patients with arrhythmia (including atrial fibrillation), and that readings in those groups may be unreliable.`,
    `Numeric circumference range per cuff, index marker, adult population declared, and the explicit list of non-validated populations — complete.`,
  ),
  rec(
    "BP-CUFF-SIZE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Two cuffs are available: the one in the box fits upper arms measuring 22 to 32 cm around, and an optional larger one fits 32 to 42 cm; each has its fitting band printed on it with a mark showing whether it is on correctly. The monitor is meant for grown-ups only; the manual says plainly that it has not been proven on children or newborns, on expectant mothers or those with pregnancy-related high blood pressure, or on people whose heartbeat is irregular, and that results in those groups cannot be relied on.`,
    `Ranges, index mark, adult-only population and the specific exclusions — without "cuff size", "arm circumference", "adult", "paediatric", "neonatal", "not validated", "arrhythmia" or "pregnancy" (the paraphrase uses "grown-ups", "children", "newborns", "irregular heartbeat", "expectant mothers").`,
  ),
  rec(
    "BP-CUFF-SIZE",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.7 Label and IFU — cuff and population. The CE-9 is supplied with a standard adult cuff. A large cuff is available separately. The device is intended for adult patients for home monitoring of blood pressure. Users with medical conditions should consult a physician before relying on home readings.`,
    `No arm-circumference range for either cuff, no range index marker, and the non-validated populations are replaced by a generic "consult a physician". The intended population is declared, so the clause is addressed — but the numeric ranges and the explicit limitations are missing — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- over-pressure
  rec(
    "BP-OVERPRESSURE",
    "SATISFIED_LITERAL",
    "PASS",
    `5.5 Over-pressure protection. The CE-9 incorporates an independent hardware pressure limiter that vents the cuff at 300 mmHg, separate from the microcontroller's software cut-off at 280 mmHg. Under single-fault conditions (pump driver shorted, firmware halted) the maximum attainable cuff pressure measured was 302 mmHg before automatic rapid deflation. A watchdog limits any single inflation to 180 s, after which the cuff is deflated automatically. Tests per IEC 80601-2-30 cl. 201.12.4.103 and 201.101 in report TR-80601-2-30-40211, section 9.`,
    `Independent limiter, over-pressure cut-off value, single-fault maximum, automatic rapid deflation, and the inflation-time limit — all evidenced by test.`,
  ),
  rec(
    "BP-OVERPRESSURE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Section 9 of Intertek's report shows what happens when things go wrong: with the pump driven continuously by a simulated short and the processor frozen, the cuff never exceeded 302 mmHg because a mechanical relief valve, which works without the electronics, opens at 300 and lets the air out fast; and a separate hardware timer releases the cuff if any measurement runs longer than three minutes.`,
    `Independent (mechanical) limiter, its trip value, the single-fault maximum, fast release, and the three-minute timer — without "over-pressure", "pressure limit", "maximum cuff pressure", "automatic deflation", "single fault", "cut-off" or "timeout".`,
  ),
  rec(
    "BP-OVERPRESSURE",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `5.5 Over-pressure protection. The CE-9 firmware limits inflation to a maximum cuff pressure of 280 mmHg and incorporates an automatic deflation function that releases cuff pressure at the end of each measurement cycle or if the measurement is aborted. Over-pressure protection was verified during firmware validation. An independent means of limiting cuff pressure is not required because the firmware is validated to IEC 62304.`,
    `A software limit and end-of-cycle deflation are described, but there is no independent (hardware) limiter, no single-fault test, and no inflation-time limit — and the passage argues the independent means away. One of the two required protections is missing — MINOR_IMPROVEMENT.`,
  ),
];

export const ECG: EvalRecord[] = [
  // ---------------------------------------------------------------- signal tests
  rec(
    "ECG-SIGNAL",
    "SATISFIED_LITERAL",
    "PASS",
    `6.1 Signal performance. Test report TR-60601-2-25-50318 (Nemko, Oslo, ILAC-accredited, 27 June 2023) to IEC 60601-2-25:2011 covers the EC-12R diagnostic electrocardiograph: amplitude accuracy ±3 %, time-base accuracy ±1 %, frequency response 0.05–150 Hz (−3 dB), impulse response overshoot <0.1 mV, input impedance >10 MΩ at 10 Hz, common-mode rejection >100 dB, system noise referred to input <30 µV p-p, tall-T-wave rejection and pacemaker-pulse rejection per clause 201.12.4.107, baseline wander and drift within limits. Each test is reported with a PASS conclusion. Report at Annex 11.`,
    `Report number, accredited laboratory, every listed signal-chain test with result, and per-test pass conclusions — complete.`,
  ),
  rec(
    "ECG-SIGNAL",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 11 is Nemko's verification (50318, June 2023) of the EC-12R against the particular standard for diagnostic electrocardiographs. Signal size is reproduced within 3 % and timing within 1 %; the pass-band runs from 0.05 to 150 Hz; a step input rings by under 0.1 mV; the front end presents more than 10 megohms to the patient and suppresses signals common to both electrodes by over 100 dB; its own hiss is below 30 microvolts peak-to-peak; a large T-wave does not upset the R-wave detector and pacing spikes are rejected; and the trace stays on the paper without wandering. Every item is marked as conforming.`,
    `All tests described with values — without "IEC 60601-2-25", "frequency response", "input impedance", "common mode rejection", "CMRR", "noise", "baseline", "drift" or "test report".`,
  ),
  rec(
    "ECG-SIGNAL",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `6.1 Signal performance. The EC-12R ECG signal chain has been tested to IEC 60601-2-27:2011 (ECG monitoring equipment): frequency response 0.67–40 Hz, input impedance >5 MΩ, common mode rejection >90 dB, noise <50 µV p-p, baseline drift within limits. Test report TR-60601-2-27-50319 (Nemko, Annex 11), all tests PASS. The EC-12R is marketed as a 12-lead resting electrocardiograph for diagnostic use.`,
    `A genuine report — to the wrong standard. IEC 60601-2-27 (monitoring ECG, 40 Hz bandwidth) is not a substitute for 60601-2-25 (diagnostic ECG, 150 Hz). For a device sold for diagnostic use this is evidence for the wrong requirement — REJECT.`,
  ),

  // ---------------------------------------------------------------- defib / CF
  rec(
    "ECG-DEFIB-CF",
    "SATISFIED_LITERAL",
    "PASS",
    `5.6 Applied part. The patient connection of the EC-12R is a defibrillation-proof Type CF applied part. Test report TR-60601-1-50310 (Nemko, Annex 7) section 8.5.5.1 records the defibrillation protection test: after a 5000 V / 360 J discharge across each lead pair the energy reaching the patient circuit was below 10 % of the delivered energy, and the trace recovered to within 10 mm of baseline within 5 s. Patient leakage current: 8 µA (normal condition), 42 µA (single-fault, mains on applied part); patient auxiliary current 7 µA. The defibrillation-proof CF symbol appears on the rear panel and on the label (Annex 8).`,
    `Type CF defib-proof classification, the defibrillation test with energy reduction and recovery time, leakage and auxiliary currents in normal and single-fault condition, and the symbol on label and equipment — complete.`,
  ),
  rec(
    "ECG-DEFIB-CF",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The electrode inputs are rated for direct cardiac connection and to survive a defibrillator shock. Annex 7 (Nemko report 50310, clause 8.5.5.1) shows that after a 5 kV, 360 J pulse across each lead pair, less than a tenth of the energy reached the patient side and the trace was usable again within five seconds; the current that could flow through a patient measured 8 microamps normally and 42 with mains on the electrodes, with 7 microamps of measuring current. The paddle-in-a-heart pictogram is on the rear panel and the packaging.`,
    `Cardiac-rated, defib-tested with energy reduction and recovery, leakage/auxiliary currents in both conditions, symbol present — without "Type CF", "CF applied part", "defibrillation-proof", "leakage current", "patient auxiliary current", "single fault", "recovery time" or "5000 V".`,
  ),
  rec(
    "ECG-DEFIB-CF",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `5.6 Applied part. The patient connection of the EC-12R is a Type BF applied part with defibrillation protection. Test report TR-60601-1-50310 (Nemko, Annex 7) records patient leakage current of 45 µA (normal condition) and 480 µA (single-fault, mains on applied part), and patient auxiliary current of 40 µA, within the Type BF limits. Defibrillation protection: energy reduction and recovery time verified per clause 8.5.5.1. The BF symbol with paddles appears on the label.`,
    `Defibrillation protection is evidenced, but the applied part is Type BF, not Type CF — and the measured currents (45/480 µA) are five to ten times the CF limits. For a diagnostic ECG this is a substantive non-conformity, not a paperwork gap — REJECT.`,
  ),

  // ---------------------------------------------------------------- algorithm / software
  rec(
    "ECG-ALGORITHM",
    "SATISFIED_LITERAL",
    "PASS",
    `7. Software and interpretation. The EC-12R provides automated measurements and interpretive statements. The interpretation algorithm was validated against the CSE multilead measurement database and the CSE diagnostic database (report ALG-EC12R-2023-01, Annex 10B): sensitivity 91.4 % and specificity 94.2 % for the seven major diagnostic categories; interval measurement bias within CSE tolerance for PR, QRS and QT. Software lifecycle documentation per IEC 62304:2006+A1:2015 is at Annex 10A with safety classification Class B, justified. The IFU (section 12) states that interpretive statements are advisory and require overread by a qualified physician.`,
    `Algorithm validation against an annotated reference database with sensitivity/specificity and measurement bias, IEC 62304 file with justified classification, and the physician-overread statement — complete.`,
  ),
  rec(
    "ECG-ALGORITHM",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Because the EC-12R prints diagnostic suggestions and interval figures, its analysis engine was benchmarked against the expert-annotated Common Standards for Electrocardiography reference sets (Annex 10B): it caught 91.4 % of the abnormalities the experts flagged and correctly cleared 94.2 % of the normals, and its PR, QRS and QT figures fell within the reference tolerances. Annex 10A contains the engineering lifecycle file under the medical software standard, with the middle safety tier assigned and reasoned. Section 12 of the manual tells the user that the printed suggestions are a starting point and that a doctor must review the trace before any decision.`,
    `Same elements — expert database, sensitivity/specificity as plain counts, measurement bias, lifecycle file with classification, overread statement — without "IEC 62304", "interpretive", "algorithm validation", "sensitivity", "specificity", "CSE", "overread" or "advisory".`,
  ),
  rec(
    "ECG-ALGORITHM",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `7. Software and interpretation. The EC-12R provides automated interval measurements and interpretive statements generated by the manufacturer's proprietary algorithm, which has been developed and refined over ten years and is used across the manufacturer's product range. Software lifecycle documentation per IEC 62304 is at Annex 10A (Class B). The IFU states that interpretive statements are advisory and require overread by a qualified physician. Algorithm performance data are proprietary and are not included in the submission.`,
    `The device interprets, the 62304 file and the overread statement are present — but the algorithm validation against a reference database, which the clause requires whenever interpretation is offered, is withheld as "proprietary". For an interpreting device, absent validation is REJECT.`,
  ),

  // ---------------------------------------------------------------- leads biocompat / colour
  rec(
    "ECG-LEADS-BIOCOMPAT",
    "SATISFIED_LITERAL",
    "PASS",
    `7.2 Patient cable and electrodes. The 10-lead patient cable, lead wires and reusable limb-clamp electrodes are surface-contacting parts evaluated per ISO 10993-1:2018 (biological evaluation report BER-EC12R-01, Annex 12): cytotoxicity (ISO 10993-5) non-cytotoxic; irritation (ISO 10993-23) non-irritant; sensitisation (ISO 10993-10) non-sensitiser. Lead identification follows the IEC colour code (R red, L yellow, F green, N black, C1–C6 white with coloured rings) consistently on the cable connectors, the device rear panel and IFU section 4. Lead connectors are 4 mm shrouded and protected against inadvertent connection to mains.`,
    `Biological evaluation with all three endpoints, a single colour convention applied consistently across cable, device and IFU, and protected connectors — complete.`,
  ),
  rec(
    "ECG-LEADS-BIOCOMPAT",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 12 reports the biological safety testing of everything that touches the patient — the trunk cable, the ten wires and the reusable limb clamps: no cell toxicity, no skin reaction, no allergic response. The wires are colour-marked in the European scheme — red right arm, yellow left arm, green left leg, black right leg, white chest wires with coloured collars — and exactly the same scheme is printed on the socket panel and in section 4 of the manual. The wire plugs are shrouded so they cannot be pushed into a mains socket.`,
    `Biological testing, three endpoints, single scheme applied to cable/device/IFU, mains-protected plugs — without "ISO 10993", "biocompatibility", "biological evaluation", "lead wire", "electrode", "patient cable", "colour code" or "IEC convention".`,
  ),
  rec(
    "ECG-LEADS-BIOCOMPAT",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `7.2 Patient cable and electrodes. The patient cable, lead wires and electrodes are evaluated per ISO 10993-1 (BER-EC12R-01, Annex 12: cytotoxicity, irritation and sensitisation all acceptable). Lead identification: the patient cable supplied uses the AHA colour code (RA white, LA black, LL red, RL green, V1–V6 brown), while the device rear panel and IFU section 4 show the IEC colour code (R red, L yellow, F green, N black). Lead connectors are 4 mm shrouded.`,
    `Biocompatibility is fine, but the cable is coded AHA while the device and IFU are coded IEC — the clause requires one convention applied consistently. Present but inconsistent, a real clinical-use hazard — MINOR_IMPROVEMENT.`,
  ),
];

export const NEBULIZER: EvalRecord[] = [
  // ---------------------------------------------------------------- aerosol
  rec(
    "NEB-AEROSOL",
    "SATISFIED_LITERAL",
    "PASS",
    `6.1 Aerosol performance. Aerosol characterisation per EN 13544-1:2007+A1 Annex CC (Inhalation Sciences, Stockholm, report AER-NB30-2023-04, Annex 11) using a Next Generation cascade impactor at 15 L/min: aerosol output 1.18 mL, aerosol output rate 0.26 mL/min, mass median aerodynamic diameter (MMAD) 3.8 µm, geometric standard deviation 2.1, respirable fraction (below 5 µm) 68 %. Test medication 0.9 % sodium chloride with 2.5 mL fill volume; results are valid for those conditions only.`,
    `Impactor method, output and output rate, MMAD, GSD, respirable fraction, and the fill/medication/flow conditions — complete.`,
  ),
  rec(
    "NEB-AEROSOL",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 11 (Inhalation Sciences, AER-NB30-2023-04) characterises the mist the NB-30 produces from a 2.5 mL charge of normal saline drawn at 15 litres per minute through an NGI: droplet distribution measured by cascade impactor, mass median 3.8 micron with a spread factor of 2.1, 68 % of the delivered mass in droplets small enough to reach the lower airways, 1.18 mL delivered in total at 0.26 mL/min. The figures hold for that charge and that liquid; other medications will differ.`,
    `Every quantity is present — without "EN 13544-1", "aerosol output", "output rate", "MMAD", "mass median aerodynamic diameter", "particle size", "µm" as a unit label, "respirable fraction" or "fill volume".`,
  ),
  rec(
    "NEB-AEROSOL",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `6.1 Aerosol performance. The NB-30 compressor nebulizer produces a fine therapeutic mist with particle size in the range 0.5–5 µm, suitable for delivery to the lower respiratory tract, at an output rate of ≥0.2 mL/min. Performance conforms to EN 13544-1. Particle size was determined by laser diffraction (Malvern Spraytec) at the manufacturer's laboratory; MMAD 3.5 µm. Fill volume and test medication were as per standard practice.`,
    `A particle-size claim with an MMAD figure — but by laser diffraction rather than the cascade impactor the standard's Annex CC specifies, no respirable fraction, no GSD, no aerosol output, and the fill volume and medication are not stated, so the declared performance cannot be tied to conditions. Addressed but materially incomplete — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- compressor
  rec(
    "NEB-COMPRESSOR",
    "SATISFIED_LITERAL",
    "PASS",
    `5.7 Compressor safety. The NB-30 piston compressor was assessed under IEC 60601-1 clauses 9 (mechanical hazards) and 15 (construction) and ISO 27427:2013 in report TR-60601-1-60402 (SGS, Annex 7): accessible surface temperature 41 °C maximum after 30 min continuous operation (limit 43 °C); declared duty cycle 30 min on / 30 min off with a thermal cut-out at 85 °C winding temperature; maximum continuous operating time 30 min; all moving parts enclosed with no accessible pinch points; A-weighted sound pressure level 52 dB(A) at 1 m per the particular standard.`,
    `Surface temperature, duty cycle and maximum operating time, thermal protection, moving-part protection and the declared dB(A) level — all evidenced.`,
  ),
  rec(
    "NEB-COMPRESSOR",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `SGS's report at Annex 7 covers the pump unit: after half an hour running flat out the outer casing reached 41 °C, under the 43 °C ceiling; the motor is rated to run for thirty minutes and then rest for thirty, and a heat switch cuts it if the windings pass 85 °C; the piston and crank are fully enclosed so no finger can reach them; and at one metre the unit measures 52 decibels on the A scale.`,
    `Same evidence — without "compressor", "duty cycle", "continuous operation", "operating time", "surface temperature", "thermal", "overheat", "noise", "sound pressure" or "dB(A)" (uses "decibels on the A scale", "pump unit", "heat switch").`,
  ),
  rec(
    "NEB-COMPRESSOR",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `5.7 Compressor safety. The NB-30 compressor has been designed for continuous home use and conforms to IEC 60601-1 (report TR-60601-1-60402, SGS, Annex 7). Sound pressure level: 52 dB(A). Moving parts are fully enclosed. The compressor motor is rated for a duty cycle of 30 min on / 30 min off and is protected by a thermal cut-out; the Instructions for Use recommend continuous nebulisation sessions of up to 60 minutes for chronic patients.`,
    `The safety evidence is largely present, but the declared 30/30 duty cycle contradicts the 60-minute continuous sessions the IFU recommends — exactly the contradiction the guidance warns about. Present but internally inconsistent — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- reprocessing
  rec(
    "NEB-REPROCESSING",
    "SATISFIED_LITERAL",
    "PASS",
    `9.2 Reprocessing. Validated reprocessing instructions per ISO 17664-2:2021 for the nebulizer chamber, mask, mouthpiece and tubing (validation report RP-NB30-2023-01, Annex 13): cleaning by manual wash in warm water with mild detergent, disinfection by boiling for 10 minutes or immersion in 0.5 % chlorhexidine for 30 minutes; validated for 60 reprocessing cycles for the chamber and mouthpiece and 30 cycles for the mask; service life 6 months for the chamber and mask, 12 months for the tubing, after which the accessory is to be discarded. The chamber and mask are single-patient use; the compressor may be used for multiple patients with a new accessory set per patient.`,
    `Method, agents and concentrations, validated cycle count, per-accessory service life and discard point, single- versus multi-patient use — complete.`,
  ),
  rec(
    "NEB-REPROCESSING",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 13 (RP-NB30-2023-01) proves out the care instructions for the parts that carry medication or touch the face — the cup, the face piece, the mouth piece and the hose: wash by hand in warm soapy water, then either boil for ten minutes or soak for half an hour in 0.5 % chlorhexidine. The cup and mouth piece were shown to withstand sixty such rounds, the face piece thirty. The cup and face piece are to be thrown away after six months and the hose after twelve. Each patient must have their own set; only the pump may be shared.`,
    `Method, agents, validated round counts, replacement intervals and single-patient rule — without "cleaning", "disinfection", "reprocessing", "ISO 17664", "validated", "cycles", "service life", "discard" or "single patient".`,
  ),
  rec(
    "NEB-REPROCESSING",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `9.2 Reprocessing. The nebulizer chamber, mask, mouthpiece and tubing should be cleaned after each use by rinsing in warm water and allowed to air-dry. Once a week the chamber may be washed with a mild detergent. Accessories should be replaced when they show signs of wear. These instructions are provided in the Instructions for Use section 6. The accessories are made of medical-grade polypropylene and PVC.`,
    `Care instructions exist, but there is no disinfection step, no validation, no cycle count and no replacement interval ("when worn" is not an interval). For reusable patient-contacting respiratory accessories this is not a partial reprocessing validation — it is the absence of one — REJECT.`,
  ),

  // ---------------------------------------------------------------- gas pathway biocompat
  rec(
    "NEB-GASPATH-BIOCOMPAT",
    "SATISFIED_LITERAL",
    "PASS",
    `7.3 Gas pathway biocompatibility. The breathing gas pathway (compressor outlet filter, tubing, chamber, mouthpiece, mask) was evaluated per the ISO 18562 series (report GP-NB30-2023-02, Annex 12B): particulate matter emission (ISO 18562-2) PM2.5 and PM10 below limits; volatile organic compound emission (ISO 18562-3) total VOC 0.08 µg/min, below the tolerable exposure; leachables in condensate (ISO 18562-4) below analytical thresholds. Mask and mouthpiece materials (silicone, polypropylene) were additionally evaluated for surface contact per ISO 10993-1 (Annex 12A). Every material in the gas pathway is identified in table 7.3.1.`,
    `All three 18562 endpoints with results, the 10993 surface evaluation, and a materials inventory of the gas pathway — complete.`,
  ),
  rec(
    "NEB-GASPATH-BIOCOMPAT",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 12B (GP-NB30-2023-02) assesses what the patient could inhale from the air route — from the pump's outlet filter through the hose and cup to the mouth piece and face piece: airborne solids in the fine and coarse fractions were below the limits, organic vapours totalled 0.08 micrograms per minute, well under the tolerable dose, and nothing measurable washed out of the parts into collected moisture. The silicone face piece and polypropylene mouth piece were separately cleared for skin contact (Annex 12A). Table 7.3.1 names every material along the route.`,
    `Particulates, VOCs, leachables in condensate, surface-contact evaluation and materials inventory — without "ISO 18562", "gas pathway", "breathing gas", "VOC", "particulate matter", "leachable", "condensate", "ISO 10993", "biocompatibility", "mask" or "mouthpiece".`,
  ),
  rec(
    "NEB-GASPATH-BIOCOMPAT",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `7.3 Gas pathway biocompatibility. The mask (silicone) and mouthpiece (polypropylene) have been evaluated for biocompatibility per ISO 10993-1, ISO 10993-5 and ISO 10993-10 (Annex 12A): non-cytotoxic, non-irritant, non-sensitising. The tubing and chamber are made from medical-grade PVC and polypropylene. All materials in contact with the patient are therefore biocompatible and the gas pathway is considered safe.`,
    `Surface-contact 10993 data are present and genuine, but the ISO 18562 evaluation of what the gas pathway emits — particulates, VOCs, leachables — is absent, and the passage reasons that 10993 covers it. The guidance is explicit that it does not. The required evaluation is missing — REJECT.`,
  ),
];
