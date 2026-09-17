import { rec, type EvalRecord } from "./types";

/**
 * Common-core clauses (apply to every device type).
 * Three passages per clause: literal, paraphrase, hard distractor.
 */
export const CORE: EvalRecord[] = [
  // ---------------------------------------------------------------- MD-15
  rec(
    "CORE-MD15-LICENCE",
    "SATISFIED_LITERAL",
    "PASS",
    `2.1 Import licence. The device is imported under import licence Form MD-15 number IMP/MD/2024/004518, granted by the Central Licensing Authority, CDSCO, on 14 March 2024 and valid until 13 March 2029. A copy of the licence is placed at Annex 2. The licence number is reproduced verbatim on the carton label (Annex 8) and on the Bill of Entry used for customs clearance, so that the three documents can be reconciled at the port.`,
    `MD-15 licence number, issuing authority, issue date and validity are all stated, and the number is tied to the label and customs paperwork — every element of the clause is met.`,
  ),
  rec(
    "CORE-MD15-LICENCE",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Regulatory permission to bring the product into India was granted by the national licensing body on 14 March 2024 under reference IMP/MD/2024/004518 and remains in force for five years from that date. The same reference appears on the outer carton artwork and on the customs entry, and the signed grant letter is included as Annex 2.`,
    `The import permission, its reference, issuing body, date and validity are all present, and the reference is cross-tied to the label and customs entry. Phrased without "MD-15", "import licence" or "licence number".`,
  ),
  rec(
    "CORE-MD15-LICENCE",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `2.1 Import licence. An application for an import licence in Form MD-15 has been submitted to the Central Licensing Authority through the authorised agent and is pending grant. The applicant undertakes to furnish the MD-15 licence number on the label and on customs documentation once the licence is issued. Import will not commence until the licence is received.`,
    `The licence has been applied for, not granted. No licence number exists, so the mandatory element is missing entirely — REJECT, despite the passage using the exact vocabulary of the clause.`,
  ),

  // ---------------------------------------------------------------- MD-14 + agent
  rec(
    "CORE-MD14-AGENT",
    "SATISFIED_LITERAL",
    "PASS",
    `2.2 Application and authorised agent. The application was made in Form MD-14 dated 02 January 2024 by Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002, Tamil Nadu, India, holder of wholesale licence 20B/21B No. TN/CH/2019/3312, acting as the Indian authorised agent of Meridian Medical GmbH. The notarised power of attorney dated 18 December 2023 by which Meridian Medical GmbH appoints Sundaram Healthcare Distributors Pvt Ltd for the purposes of Rule 35 is at Annex 3.`,
    `Form MD-14, a named agent with a complete Indian address and wholesale licence, and the notarised power of attorney are all present.`,
  ),
  rec(
    "CORE-MD14-AGENT",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The submission to CDSCO was lodged by the manufacturer's appointed representative in India, Sundaram Healthcare Distributors Pvt Ltd of 41 Anna Salai, Chennai 600002, which holds a current wholesale drugs licence (TN/CH/2019/3312). The instrument appointing that firm to act for Meridian Medical GmbH before the Indian regulator was executed before a notary in Munich on 18 December 2023 and is reproduced at Annex 3, together with the completed application form itself.`,
    `An appointed Indian representative with address and licence, the notarised appointment instrument, and the application form are all present — the same three elements, without "MD-14", "authorised agent" or "power of attorney".`,
  ),
  rec(
    "CORE-MD14-AGENT",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `2.2 Application and authorised agent. The application in Form MD-14 was submitted on 02 January 2024. The Indian authorised agent is Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002, holder of wholesale licence TN/CH/2019/3312. A power of attorney in favour of the agent is being executed by the manufacturer and will be furnished on request.`,
    `The form and a named agent with address are present, but the power of attorney — the instrument that actually makes the agent the agent — has not been provided. The requirement is addressed but one mandatory element is unmet: MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- Free Sale Certificate
  rec(
    "CORE-FSC",
    "SATISFIED_LITERAL",
    "PASS",
    `2.3 Free Sale Certificate. A Free Sale Certificate for the FS-200 Fingertip Pulse Oximeter was issued by the Bundesinstitut für Arzneimittel und Medizinprodukte (BfArM), the national regulatory authority of Germany, the country of origin, under certificate number 2023/FSC/88214 dated 05 November 2023, confirming that the device is freely sold in Germany. The certificate is valid for two years and is placed at Annex 4 with an apostille.`,
    `Certificate issued by the national regulatory authority of the country of origin, names the device, dated, valid, attached — fully compliant.`,
  ),
  rec(
    "CORE-FSC",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Confirmation that the FS-200 may be lawfully placed on the German market was obtained from BfArM, the federal medicines and medical devices regulator, on 05 November 2023 (their reference 2023/FSC/88214). The apostilled original of this regulator-issued confirmation is at Annex 4; it remains current until November 2025.`,
    `A regulator-issued confirmation of lawful marketing in the country of origin, naming the device, dated and current — the substance of a Free Sale Certificate without the phrase "Free Sale Certificate" or "country of origin".`,
  ),
  rec(
    "CORE-FSC",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `2.3 Free Sale Certificate. In lieu of a Free Sale Certificate from the country of origin, the manufacturer encloses a Declaration of Conformity signed by its Quality Director, together with the EC Certificate of its ISO 13485 quality system, and confirms that the FS-200 is freely sold in Germany and in over thirty other countries. The manufacturer is willing to procure a Free Sale Certificate should the licensing authority insist.`,
    `A self-declaration by the manufacturer has been substituted for a certificate issued by the national regulatory authority. The clause is explicit that a self-declaration does not satisfy it — REJECT, even though every keyword is present.`,
  ),

  // ---------------------------------------------------------------- ISO 13485
  rec(
    "CORE-ISO13485",
    "SATISFIED_LITERAL",
    "PASS",
    `3.1 Quality management system. The manufacturing site at Industriestrasse 12, 82256 Fürstenfeldbruck, Germany, holds ISO 13485:2016 certificate number DE-QMS-2022-77413 issued by TÜV SÜD Product Service GmbH. Scope of certification: design, development and manufacture of non-invasive patient monitoring equipment including pulse oximeters. Date of issue 11 April 2022; valid until 10 April 2026. The certificate and the most recent surveillance audit report (October 2024) are at Annex 5.`,
    `Standard and year, certification body, certificate number, scope covering the device, site address and expiry date are all stated and the certificate is current.`,
  ),
  rec(
    "CORE-ISO13485",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The quality management certificate issued to the Fürstenfeldbruck plant by the notified body TÜV SÜD under EN ISO 13485 remains in force until 31 March 2028 (registration Q1 20 22 77413 R1). Its scope covers the design and production of non-invasive physiological monitors, which encompasses the FS-200. The current registration document and the report of the last surveillance visit are reproduced at Annex 5.`,
    `Same substance — body, registration reference, scope covering the device, site, in-force date — with "remains in force until" and "registration" instead of "valid until" and "certificate number".`,
  ),
  rec(
    "CORE-ISO13485",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `3.1 Quality management system. The manufacturer holds ISO 13485:2016 certificate number DE-QMS-2019-51120 issued by TÜV SÜD Product Service GmbH for the design and manufacture of non-invasive patient monitoring equipment at Industriestrasse 12, Fürstenfeldbruck. Date of issue 12 April 2019; valid until 11 April 2022. Recertification audit has been scheduled and the renewed certificate will be forwarded to the licensing authority upon receipt.`,
    `Every field is present and the scope is right — but the expiry date has passed. An expired certificate does not satisfy the clause; because the QMS evidently exists and is being renewed, this is MINOR_IMPROVEMENT rather than REJECT.`,
  ),

  // ---------------------------------------------------------------- ISO 14971
  rec(
    "CORE-ISO14971",
    "SATISFIED_LITERAL",
    "PASS",
    `4.1 Risk management. Risk management has been carried out in accordance with ISO 14971:2019 across the device lifecycle. The risk management file at Annex 6 comprises the risk management plan RMP-FS200-01, the hazard identification and risk analysis worksheet (design FMEA, 64 identified hazards), the risk evaluation and risk control table with verification of effectiveness for each control, the residual risk evaluation, and the signed risk management report RMR-FS200-03, which concludes that the overall residual risk is acceptable in relation to the clinical benefit.`,
    `The complete risk management file is enumerated — plan, hazard analysis, controls with verification, residual risk evaluation and a signed report with the acceptability conclusion.`,
  ),
  rec(
    "CORE-ISO14971",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 6 sets out how foreseeable harms from the FS-200 were identified, weighed and reduced. Sixty-four hazardous situations were catalogued from a design failure-mode study; for each, the mitigating design feature is named and the test that proves it works is cross-referenced. The remaining, unmitigated exposure was assessed against the clinical benefit and judged tolerable in a report signed by the Head of Regulatory Affairs on 3 February 2024. The governing procedure, its scope and the acceptance criteria are laid down in a plan approved before the analysis began.`,
    `Plan, hazard identification, controls with verification, residual-risk evaluation and signed acceptability conclusion are all described — without "ISO 14971", "risk management", "FMEA" or "residual risk".`,
  ),
  rec(
    "CORE-ISO14971",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `4.1 Risk management. The manufacturer confirms that risk management activities were performed for the FS-200 in accordance with ISO 14971:2019 and that a risk management report has been prepared. The FS-200 has been on the market since 2021 with no reported serious incidents, which the manufacturer considers to demonstrate that the residual risk is acceptable. The risk management file is retained at the manufacturing site and is available for inspection.`,
    `The passage asserts that risk management was done but supplies no file: no plan, no hazard analysis, no controls, no report. A statement that a file exists elsewhere is not the file. The mandatory document is absent — REJECT.`,
  ),

  // ---------------------------------------------------------------- IEC 60601-1
  rec(
    "CORE-IEC60601-1",
    "SATISFIED_LITERAL",
    "PASS",
    `5.1 Electrical safety. Conformity with IEC 60601-1:2005 + A1:2012 + A2:2020 (general requirements for basic safety and essential performance) is demonstrated by test report number TR-60601-1-22884 issued by TÜV SÜD Product Service GmbH, an ILAC-MRA accredited test laboratory, dated 19 September 2023. The applied part is classified Type BF. The report covers dielectric strength, leakage currents in normal and single-fault condition, mechanical strength and marking, and concludes PASS on all applicable clauses. Full report at Annex 7.`,
    `Base standard with edition, accredited laboratory, report number, applied-part type and explicit pass conclusion — complete.`,
  ),
  rec(
    "CORE-IEC60601-1",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 7 contains the third-party type-test certificate for the general medical electrical safety standard (third edition with both amendments), reference TR-60601-1-22884, issued 19 September 2023 by TÜV SÜD's laboratory in Munich, which is accredited under the international laboratory accreditation arrangement. The patient-connected part is rated body-floating (BF). All applicable requirements — insulation withstand, earth and patient leakage under normal and fault conditions, mechanical and marking checks — were found to conform.`,
    `Same content with "general medical electrical safety standard (third edition…)" rather than "IEC 60601-1", "type-test certificate" for "test report", "found to conform" for "pass".`,
  ),
  rec(
    "CORE-IEC60601-1",
    "NOT_SATISFIED_DISTRACTOR",
    "REJECT",
    `5.1 Electrical safety. The FS-200 has been designed to comply with the following standards: IEC 60601-1:2005+A1+A2 (general requirements for basic safety and essential performance), IEC 60601-1-2:2014, IEC 60601-1-11:2015 and ISO 80601-2-61:2017. Compliance has been verified by the manufacturer's in-house test department in accordance with its design verification procedure DVP-07, and the applied part is classified Type BF.`,
    `IEC 60601-1 is named in a list of applied standards and "verified in-house"; there is no test report number, no accredited laboratory and no attached report. Listing a standard is not evidence of conformity to it — REJECT.`,
  ),

  // ---------------------------------------------------------------- EMC
  rec(
    "CORE-EMC",
    "SATISFIED_LITERAL",
    "PASS",
    `5.2 Electromagnetic compatibility. Conformity with IEC 60601-1-2:2014 + A1:2020 is demonstrated by EMC test report number TR-EMC-22891 (TÜV SÜD Product Service GmbH, 22 September 2023). Emissions were tested to CISPR 11 Group 1 Class B. Immunity was tested at the levels specified for the home healthcare environment, including ESD ±8 kV contact / ±15 kV air, radiated RF 10 V/m, and proximity fields from wireless communications equipment. The declared electromagnetic environment is home healthcare. The manufacturer's EMC declaration tables are reproduced in section 8 of the Instructions for Use. Report at Annex 7.`,
    `Report number, emission and immunity coverage, declared environment and the IFU declaration tables are all present.`,
  ),
  rec(
    "CORE-EMC",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Annex 7 also holds the report on electromagnetic disturbance (reference TR-EMC-22891, TÜV SÜD, 22 September 2023). The device's own radio-frequency output was measured against the Group 1 Class B limits, and its resistance to external interference — electrostatic discharge at ±8 kV contact and ±15 kV air, radiated fields at 10 V/m, and the near-field test for handheld transmitters — was verified at the higher levels the collateral standard prescribes for equipment used in the home. The user manual reproduces the manufacturer's guidance tables on the electromagnetic environment in section 8.`,
    `Covers emissions, immunity levels, the home-healthcare environment and the IFU tables without "IEC 60601-1-2", "EMC", "emission", "immunity" or "test report".`,
  ),
  rec(
    "CORE-EMC",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `5.2 Electromagnetic compatibility. EMC test report TR-EMC-22891 (TÜV SÜD, 22 September 2023) demonstrates conformity with IEC 60601-1-2:2014. Emissions were tested to CISPR 11 Group 1 Class B and immunity to the levels specified for the professional healthcare facility environment. The FS-200 is intended for use by patients at home as well as in clinics. The EMC declaration tables are reproduced in the Instructions for Use.`,
    `A real report exists, but immunity was tested only at professional-facility levels while the device is intended for home use, which the collateral standard tests at higher levels. Present but inadequate for the declared use — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- Label: manufacturer
  rec(
    "CORE-LBL-MFR",
    "SATISFIED_LITERAL",
    "PASS",
    `8.1 Label — manufacturer. The device label and the outer carton artwork (Annex 8, drawings LBL-FS200-DEV-03 and LBL-FS200-CTN-03) carry the manufacturer symbol followed by: "Manufactured by: Meridian Medical GmbH, Industriestrasse 12, 82256 Fürstenfeldbruck, Germany". This is the address of the manufacturing site named on the ISO 13485 certificate, not a sales office.`,
    `Manufacturer name and the complete manufacturing site address appear on the device label and the carton, and the address is the certified site.`,
  ),
  rec(
    "CORE-LBL-MFR",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The legal entity responsible for production, Meridian Medical GmbH, and the full postal location of the plant where the FS-200 is assembled — Industriestrasse 12, 82256 Fürstenfeldbruck, Germany — are printed beside the factory pictogram on both the unit marking and the retail box (drawings LBL-FS200-DEV-03 / CTN-03 at Annex 8). The location given is the certified production plant.`,
    `Producer identity and full plant location on unit and box, tied to the certified site — without "manufactured by", "manufacturer", "address" or "label".`,
  ),
  rec(
    "CORE-LBL-MFR",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.1 Label — manufacturer. The device label and carton artwork (Annex 8) carry the manufacturer symbol followed by "Manufactured by: Meridian Medical GmbH, Germany" and, beneath it, "Distributed in India by Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002". The full postal address of the manufacturer is stated in the Instructions for Use.`,
    `The only complete address on the label belongs to the Indian distributor; the manufacturer is identified by name and country alone. The clause requires the complete manufacturing site address on the label itself — a country name is explicitly insufficient. Present but wrong — MINOR_IMPROVEMENT (revised artwork).`,
  ),

  // ---------------------------------------------------------------- Label: importer + licence
  rec(
    "CORE-LBL-IMPORTER",
    "SATISFIED_LITERAL",
    "PASS",
    `8.2 Label — importer and licence. The carton artwork (Annex 8) carries, in addition to the manufacturer block: "Imported and marketed by: Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002, India" and "Import licence number: IMP/MD/2024/004518". The licence number matches the MD-15 licence at Annex 2.`,
    `Importer name and Indian address and the import licence number are on the label, and the number matches the licence in the dossier.`,
  ),
  rec(
    "CORE-LBL-IMPORTER",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Beneath the producer's details, the retail box shows the Indian firm that brings the product into the country and sells it — Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002 — together with the CDSCO permission reference IMP/MD/2024/004518, which is the same reference as on the grant at Annex 2.`,
    `Importer identity, Indian address and licence reference on the box, reconciled to the grant — without "imported by", "importer", "import licence number" or "label".`,
  ),
  rec(
    "CORE-LBL-IMPORTER",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.2 Label — importer and licence. The carton artwork (Annex 8) carries: "Imported and marketed by: Sundaram Healthcare Distributors Pvt Ltd, 41 Anna Salai, Chennai 600002, India" and "Import licence number: IMP/MD/2021/001192". The importer's wholesale licence number TN/CH/2019/3312 also appears on the carton.`,
    `The importer block is complete, but the import licence number printed on the label (IMP/MD/2021/001192) is not the MD-15 licence quoted for this device (IMP/MD/2024/004518) — it belongs to an earlier licence. The field is present but wrong — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- Label: bilingual
  rec(
    "CORE-LBL-BILINGUAL",
    "SATISFIED_LITERAL",
    "PASS",
    `8.3 Label — language. The FS-200 is intended for home use. The carton artwork (Annex 8) carries the statement "For Sale in India" in English with the Hindi (Devanagari) rendering "भारत में बिक्री के लिए" immediately below it, and the essential particulars — device name, intended use, manufacturer and importer — are presented bilingually in Hindi and English in the same panel.`,
    `"For Sale in India" is present, and the essential particulars are bilingual Hindi/English for a home-use device — fully met.`,
  ),
  rec(
    "CORE-LBL-BILINGUAL",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Because the product is sold to consumers, the retail box carries the Indian-market declaration in both scripts — the English wording and its Devanagari equivalent "भारत में बिक्री के लिए" set one above the other — and the principal particulars (product name, purpose, producer, importer) are repeated in Devanagari alongside the English text on the same face of the carton (Annex 8, panel C).`,
    `Bilingual Indian-market declaration and bilingual particulars on a consumer product, described without "For Sale in India", "Hindi" or "bilingual" in the English text.`,
  ),
  rec(
    "CORE-LBL-BILINGUAL",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.3 Label — language. The FS-200 is intended for home use. The carton artwork (Annex 8) carries the statement "For Sale in India" in English. All label particulars are in English, which is the language of the Instructions for Use; a Hindi translation of the Instructions for Use is available on the importer's website. Bilingual artwork can be prepared if required by the licensing authority.`,
    `The English "For Sale in India" statement is present, but the essential particulars are English-only on a home-use device, which the clause requires to be bilingual. An online IFU translation does not satisfy a label requirement — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- Label: symbols
  rec(
    "CORE-LBL-SYMBOLS",
    "SATISFIED_LITERAL",
    "PASS",
    `8.4 Label — symbols. Symbols used on the artwork conform to ISO 15223-1:2021. The symbol glossary reproduced in section 1 of the Instructions for Use lists each symbol with its meaning: manufacturer, date of manufacture, batch code (LOT), serial number (SN), catalogue number (REF), consult instructions for use, Type BF applied part, temperature and humidity limits, and "keep dry". Annex 8 marks the position of each symbol on the device label and carton.`,
    `ISO 15223-1 conformity, an explicit glossary in the IFU, and the symbols actually used — all present.`,
  ),
  rec(
    "CORE-LBL-SYMBOLS",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `Wherever a pictogram replaces text on the packaging, the harmonised medical-device graphical symbols standard has been followed, and a key explaining every pictogram — factory, calendar-with-date, LOT, SN, REF, the book-with-"i", the body-floating applied-part mark, the thermometer and droplet limits, and the umbrella — is printed as the first section of the user manual. Annex 8 shows where each pictogram sits on the unit and the box.`,
    `Harmonised-symbol conformity, an explanatory key in the manual, and the specific symbols — described without "ISO 15223", "symbol", "batch", "serial number" or "date of manufacture".`,
  ),
  rec(
    "CORE-LBL-SYMBOLS",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `8.4 Label — symbols. The device label and carton use the standard symbols for manufacturer, date of manufacture, batch code, serial number, catalogue number and "consult instructions for use" as shown on the artwork at Annex 8. These symbols are internationally recognised and are in use on the manufacturer's products in the EU and the USA, so no explanatory legend has been included in the Instructions for Use.`,
    `The symbols are used but there is no glossary anywhere — the clause requires their meaning to be explained in the IFU. "Internationally recognised" is not a legend. Present but incomplete — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- IFU
  rec(
    "CORE-IFU",
    "SATISFIED_LITERAL",
    "PASS",
    `9. Instructions for Use. The IFU (document IFU-FS200-EN rev 6, Annex 9) is supplied in English with every unit and contains: intended use and intended user; indications for use; step-by-step operating instructions; contraindications; warnings, cautions and precautions; the residual risks communicated to the user; cleaning and maintenance instructions; storage and transport conditions (−20 to +60 °C, 10 to 93 % RH); expected service life of five years; and the contact details for reporting an adverse event or complaint in India (Materiovigilance cell, Sundaram Healthcare Distributors Pvt Ltd, vigilance@sundaramhealth.in, +91 44 4000 1200).`,
    `Every mandatory content element is enumerated, including the India adverse-event contact.`,
  ),
  rec(
    "CORE-IFU",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `An English-language user manual (IFU-FS200-EN rev 6, Annex 9) accompanies each device. It explains what the product is for and who should use it; how to take a reading, step by step; the situations in which it must not be used; the hazards to guard against and the harms that cannot be fully designed out; how to clean and look after it; the temperature and humidity it may be kept and shipped in; how many years it is expected to last; and whom to contact in India — by e-mail or telephone — if something goes wrong or a complaint needs to be made.`,
    `Every required element is present in plain language: purpose/user, operation, contraindications, warnings, residual risks, cleaning, storage/transport, service life, India complaint route — without "instructions for use", "intended use", "contraindication", "warning" or "storage".`,
  ),
  rec(
    "CORE-IFU",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `9. Instructions for Use. The IFU (IFU-FS200-EN rev 5, Annex 9) is supplied in English and contains the intended use and intended user, operating instructions, contraindications, warnings and precautions, residual risks, cleaning and maintenance instructions, storage and transport conditions and the expected service life. Adverse events may be reported to the manufacturer at vigilance@meridian-medical.de or to the competent authority in the user's country.`,
    `Nearly complete, but the adverse-event route given is the German manufacturer and a generic "competent authority"; there is no Indian contact for reporting complaints, which the clause requires. Present but one element missing — MINOR_IMPROVEMENT.`,
  ),

  // ---------------------------------------------------------------- DMF
  rec(
    "CORE-DMF",
    "SATISFIED_LITERAL",
    "PASS",
    `1. Device Master File — index. This Device Master File is submitted in the format of the Fourth Schedule, Part II. Table of contents: 1 executive summary; 2 device description and intended use; 3 manufacturing process and site details; 4 list of applied standards; 5 design verification and validation data; 6 clinical accuracy study; 7 stability and shelf-life data; 8 labelling and packaging set; 9 Instructions for Use; 10 post-market surveillance plan and vigilance procedure. Each numbered section is present in this bundle and every annex referenced in the sections is attached (Annexes 1–12).`,
    `Fourth Schedule format, an internal index, every required section listed, and confirmation that each referenced document is actually in the bundle.`,
  ),
  rec(
    "CORE-DMF",
    "SATISFIED_PARAPHRASE",
    "PASS",
    `The technical dossier is organised in the sequence prescribed by the Rules, with a numbered list of its contents on the first page: an overview of the product and what it is for; how and where it is made; the standards applied; the bench and clinical evidence that it performs as claimed; how long it keeps; the artwork set and user manual; and how the manufacturer will watch the product after sale and report problems. All twelve annexes cited in the body are enclosed; none is "available on request".`,
    `Prescribed format, a contents list, every required section, and all referenced annexes enclosed — without "Device Master File", "index", "table of contents", "post-market surveillance" or "vigilance".`,
  ),
  rec(
    "CORE-DMF",
    "NOT_SATISFIED_DISTRACTOR",
    "MINOR_IMPROVEMENT",
    `1. Device Master File — index. This Device Master File is submitted in the format of the Fourth Schedule. Table of contents: 1 executive summary; 2 device description and intended use; 3 manufacturing process; 4 list of applied standards; 5 design verification and validation data (Annex 5); 6 clinical study report (Annex 6); 7 stability data (Annex 7); 8 labelling set (Annex 8); 9 post-market surveillance plan (Annex 10). Annexes 5, 6 and 7 are held at the manufacturing site and will be made available to the licensing authority on request.`,
    `The index is present and complete, but three of the annexes it references are not in the bundle. The clause states that every document referenced in the index must actually be present. The structure exists, the content is missing — MINOR_IMPROVEMENT.`,
  ),
];
