/**
 * Seeds the MDR-2017 rule library.
 *
 * 13 COMMON CORE clauses apply to every imported device; 4 DEVICE-SPECIFIC
 * clauses are attached to each of the 5 supported device types (33 total).
 *
 * Clause references follow the structure of the Medical Device Rules, 2017
 * (G.S.R. 78(E)) as amended, and the CDSCO import pathway (Form MD-14
 * application / Form MD-15 licence).
 *
 * Each clause carries three retrieval aids:
 *   keywords  — pipe-separated groups, comma-separated synonyms inside a
 *               group. ALL groups must hit for lexical full coverage. This is
 *               the deterministic "rules-as-code" signal.
 *   synonyms  — flat controlled vocabulary used to expand the BM25 query:
 *               standard aliases, Indian form names, unit/numeral variants and
 *               common regulatory phrasings.
 *   code      — stable identifier; the filename of this clause's evaluation
 *               fixtures. Do not change once fixtures exist.
 */
import path from "node:path";
import { PrismaClient } from "../generated/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: `file:${path.resolve(__dirname, "dev.db")}` },
  },
});

type SeedClause = {
  code: string;
  category: string;
  clauseRef: string;
  title: string;
  requirementText: string;
  mandatory?: boolean;
  keywords: string;
  synonyms: string;
  guidance: string;
};

// ---------------------------------------------------------------------------
// COMMON CORE — applies to all five device types
// ---------------------------------------------------------------------------

const COMMON_CORE: SeedClause[] = [
  {
    code: "CORE-MD15-LICENCE",
    category: "Licensing & Registration",
    clauseRef: "MDR-2017 Rule 36 r/w Form MD-15",
    title: "Import licence (Form MD-15) number present",
    requirementText:
      "No medical device may be imported into India except under an import licence granted in Form MD-15 by the Central Licensing Authority. The dossier must state the MD-15 licence number issued against this device, together with the date of issue, and the licence must be current on the date of import. The licence number quoted in the dossier must be identical to the number printed on the product label and on the customs documentation.",
    keywords: "md-15,md 15,form md-15,import licence,import license|licence number,license number,licence no,license no",
    synonyms:
      "MD-15, MD 15, Form MD-15, import licence, import license, licence to import, permission to import, Central Licensing Authority, CDSCO licence, CLA, licence number, license no, registration certificate for import, import authorisation, IMP/MD, validity of licence, date of issue",
    guidance:
      "Look for a licence identifier of the form MD-15 followed by a serial number, plus its issue date. A licence that is quoted without a number, or whose number differs between the label and the dossier, is a minor improvement, not a pass.",
  },
  {
    code: "CORE-MD14-AGENT",
    category: "Licensing & Registration",
    clauseRef: "MDR-2017 Rule 35 r/w Form MD-14",
    title: "Form MD-14 application and Indian Authorised Agent appointment",
    requirementText:
      "An application for an import licence must be made in Form MD-14 by an authorised agent who holds a valid manufacturing or wholesale licence in India, or by the Indian subsidiary of the overseas manufacturer. The dossier must contain the submitted Form MD-14, the name and full Indian address of the authorised agent, and the notarised power of attorney or letter of authorisation by which the overseas manufacturer appoints that agent.",
    keywords:
      "md-14,md 14,form md-14|authorised agent,authorized agent,indian agent,indian authorised agent|power of attorney,letter of authorisation,letter of authorization,authorisation letter",
    synonyms:
      "MD-14, MD 14, Form MD-14, application for import licence, authorised agent, authorized agent, Indian agent, local representative, India representative, Indian subsidiary, wholesale licence 20B, 21B, Form 20B, power of attorney, POA, letter of authorisation, notarised authorisation, appointment letter, agent address in India",
    guidance:
      "All three elements must be present: the MD-14 form itself, a named Indian agent with an Indian address, and the instrument appointing them. A named agent with no power of attorney is the most common gap.",
  },
  {
    code: "CORE-FSC",
    category: "Licensing & Registration",
    clauseRef: "MDR-2017 Rule 35(2) r/w Fourth Schedule, Part II",
    title: "Free Sale Certificate from country of origin",
    requirementText:
      "The application must be accompanied by a Free Sale Certificate, Certificate to Foreign Government, or equivalent regulatory clearance issued by the National Regulatory Authority of the country of origin, confirming that the device is freely sold in that country. The certificate must name this device, must be issued by the competent authority (not self-declared by the manufacturer), and must be valid on the date of application.",
    keywords:
      "free sale certificate,certificate to foreign government,certificate of free sale,cfs|country of origin,issuing authority,national regulatory authority,competent authority",
    synonyms:
      "Free Sale Certificate, FSC, certificate of free sale, Certificate to Foreign Government, CFG, export certificate, marketing authorisation in country of origin, national regulatory authority, competent authority, BfArM, MHRA, US FDA, TGA, Health Canada, notified body, freely sold, legally marketed in the country of origin",
    guidance:
      "A manufacturer's own declaration of conformity is NOT a Free Sale Certificate. The issuing body must be a national regulatory authority such as the FDA, BfArM, MHRA or a notified body acting for one.",
  },
  {
    code: "CORE-ISO13485",
    category: "Quality Management",
    clauseRef: "MDR-2017 Fifth Schedule r/w ISO 13485:2016",
    title: "ISO 13485 quality management system certificate, valid and unexpired",
    requirementText:
      "The overseas manufacturing site must hold a current ISO 13485:2016 quality management system certificate covering the design and manufacture of this device category. The dossier must include the certificate showing the accredited certification body, the certificate number, the scope of certification, the certified site address, and the expiry date. A certificate that has lapsed, or whose scope does not cover this device, does not satisfy this requirement.",
    keywords:
      "iso 13485,en iso 13485|certificate number,certificate no,registration number|valid until,expiry,expires,valid to,date of expiry",
    synonyms:
      "ISO 13485, ISO 13485:2016, EN ISO 13485, EN ISO 13485:2016, QMS certificate, quality management system certificate, quality system certification, certificate number, certificate no, registration number, scope of certification, certification body, notified body, TUV, BSI, DNV, SGS, valid until, expires on, remains in force until, date of expiry, surveillance audit",
    guidance:
      "Check three things: the standard year (2016), that the scope text mentions this device or its family, and that the expiry date has not passed. A certificate with no visible expiry date is a minor improvement.",
  },
  {
    code: "CORE-ISO14971",
    category: "Risk Management",
    clauseRef: "MDR-2017 First Schedule, Part I r/w ISO 14971:2019",
    title: "ISO 14971 risk management file",
    requirementText:
      "The manufacturer must establish, document and maintain a risk management process conforming to ISO 14971:2019 across the device lifecycle. The dossier must contain the risk management file: the risk management plan, the hazard identification and risk analysis, the risk evaluation and control measures with evidence of their effectiveness, the residual risk evaluation, and a signed risk management report concluding that overall residual risk is acceptable.",
    keywords:
      "iso 14971,risk management|risk analysis,hazard analysis,hazard identification,fmea|risk management report,residual risk,risk control",
    synonyms:
      "ISO 14971, ISO 14971:2019, EN ISO 14971, risk management file, RMF, risk management plan, risk management report, hazard analysis, hazard identification, risk analysis, FMEA, design FMEA, dFMEA, failure mode and effects analysis, risk control measures, risk mitigation, residual risk, benefit-risk analysis, acceptability of risk",
    guidance:
      "A one-line statement that 'risk management has been performed' is not a risk management file. Expect to see hazards, controls, and a residual-risk conclusion.",
  },
  {
    code: "CORE-IEC60601-1",
    category: "Safety Testing",
    clauseRef: "MDR-2017 First Schedule, Part II r/w IEC 60601-1:2005+A1+A2",
    title: "IEC 60601-1 general electrical safety test report",
    requirementText:
      "Every electrically powered medical device must demonstrate conformity with IEC 60601-1, Medical electrical equipment — Part 1: General requirements for basic safety and essential performance. The dossier must include a test report from an accredited (ILAC/NABL) laboratory stating the report number, the issuing laboratory, the edition and amendments applied, the classification of the applied part (Type B, BF or CF), and an explicit pass conclusion.",
    keywords:
      "iec 60601-1,en 60601-1,60601-1|test report,report no,report number|accredited,nabl,ilac,notified body,test laboratory",
    synonyms:
      "IEC 60601-1, EN 60601-1, IS 13450, 60601-1 third edition, basic safety and essential performance, general requirements for basic safety, electrical safety test report, type test report, test report number, accredited laboratory, ILAC, NABL, applied part, Type B, Type BF, Type CF, dielectric strength, earth leakage, protective earth",
    guidance:
      "Be careful not to accept a collateral standard (60601-1-2, 60601-1-8) as evidence for the base standard. Look for the bare '60601-1' plus a report number.",
  },
  {
    code: "CORE-EMC",
    category: "Safety Testing",
    clauseRef: "MDR-2017 First Schedule, Part II r/w IEC 60601-1-2:2014+A1",
    title: "IEC 60601-1-2 electromagnetic compatibility (EMC) test report",
    requirementText:
      "The device must comply with IEC 60601-1-2 for electromagnetic disturbances, covering both emissions and immunity in the intended use environment. The dossier must include the EMC test report with the report number, the immunity test levels applied, the declared electromagnetic environment (professional healthcare facility or home healthcare), and the EMC declaration tables that are required to be reproduced in the Instructions for Use.",
    keywords:
      "iec 60601-1-2,60601-1-2,electromagnetic compatibility,emc|emission,immunity|test report,report no,report number",
    synonyms:
      "IEC 60601-1-2, EN 60601-1-2, 60601-1-2 edition 4, electromagnetic compatibility, EMC, electromagnetic disturbances, emissions, radiated emissions, conducted emissions, CISPR 11, immunity, electrostatic discharge, ESD, radiated RF immunity, electrical fast transient, surge, voltage dip, home healthcare environment, professional healthcare facility environment, EMC declaration tables",
    guidance:
      "Home-healthcare devices (thermometers, BP monitors, nebulizers sold to consumers) require the higher home-healthcare immunity levels. Flag a report that only declares the professional environment for a home-use device.",
  },
  {
    code: "CORE-LBL-MFR",
    category: "Labelling",
    clauseRef: "MDR-2017 Third Schedule, Part I, cl. 1",
    title: "Label bears manufacturer name and full manufacturing site address",
    requirementText:
      "The label on the device and on every outer package must state the name of the manufacturer and the complete address of the premises where the device was manufactured. Where the device is manufactured at a site other than the licence holder's registered office, the actual manufacturing site address must appear. A country name alone, or a marketing office address, is not sufficient.",
    keywords:
      "manufactured by,manufacturer,mfd by,legal manufacturer|address,street,strasse,road,marg,salai,avenue,lane,postal code,post code,zip,pin code|label,labelling,labeling,artwork",
    synonyms:
      "manufactured by, manufacturer, legal manufacturer, mfd by, name and address of manufacturer, manufacturing site, site of manufacture, premises, factory address, plant address, registered office, complete address, postal code, PIN code, label, labelling, labeling, carton, artwork, outer package, primary label",
    guidance:
      "Cross-check the address on the label against the site named on the ISO 13485 certificate — a mismatch between them is a classic reason for rejection.",
  },
  {
    code: "CORE-LBL-IMPORTER",
    category: "Labelling",
    clauseRef: "MDR-2017 Third Schedule, Part I, cl. 2 r/w Rule 44",
    title: "Label bears import licence number and importer details",
    requirementText:
      "The label of an imported device must carry the import licence number under which the device is imported, together with the name and address of the importer in India. This is in addition to the manufacturer's details. The licence number printed on the label must match the MD-15 licence quoted in the application dossier.",
    keywords:
      "import licence number,import license number,md-15,licence no,license no|importer,imported by,imported and marketed by|label,labelling,labeling,artwork",
    synonyms:
      "import licence number on label, import license number, MD-15 number on carton, imported by, importer, imported and marketed by, marketed by, name and address of importer, Indian importer, distributor in India, label, carton, artwork, secondary packaging",
    guidance:
      "This is about the label artwork, not the dossier cover page. If the artwork shows the manufacturer's details but no importer block, that is a minor improvement requiring revised artwork.",
  },
  {
    code: "CORE-LBL-BILINGUAL",
    category: "Labelling",
    clauseRef: "MDR-2017 Third Schedule, Part I, cl. 3",
    title: "Bilingual (Hindi and English) declaration and 'For Sale in India' statement",
    requirementText:
      "Particulars required on the label must be shown in English, and may additionally be shown in Hindi; where the device is intended for retail or home use the essential particulars and the declaration that the device is for sale in India must be presented bilingually in Hindi and English. The label must carry the statement 'For Sale in India' (and, where applicable, any restriction such as 'To be sold by retail on the prescription of a registered medical practitioner').",
    keywords: "for sale in india,sale in india|hindi,bilingual,devanagari|english",
    synonyms:
      "For Sale in India, for sale in India only, sale in India, Hindi, Devanagari, bilingual, dual language, English and Hindi, vernacular, to be sold by retail on the prescription of a registered medical practitioner, Rx only statement, label particulars in English",
    guidance:
      "Both halves matter: the 'For Sale in India' statement AND evidence that the label artwork is bilingual. Artwork that is English-only for a home-use device is a minor improvement.",
  },
  {
    code: "CORE-LBL-SYMBOLS",
    category: "Labelling",
    clauseRef: "MDR-2017 Third Schedule, Part I, cl. 5 r/w ISO 15223-1:2021",
    title: "Labelling symbols conform to ISO 15223-1",
    requirementText:
      "Where symbols are used in place of text on the label, they must be the harmonised symbols of ISO 15223-1:2021 and their meaning must be explained in the Instructions for Use. The dossier must show the symbol glossary actually used on the artwork, including as applicable the manufacturer symbol, date of manufacture, batch/lot code, serial number, use-by date, catalogue number, consult-IFU symbol and the applied-part type marking.",
    keywords:
      "iso 15223,15223,symbol,symbols|batch,lot number,lot no,serial number,catalogue number,ref|date of manufacture,manufacturing date,use by,expiry date",
    synonyms:
      "ISO 15223-1, ISO 15223-1:2021, EN ISO 15223-1, harmonised symbols, graphical symbols, symbol glossary, symbol legend, key to symbols, batch code, LOT, lot number, serial number, SN, catalogue number, REF, date of manufacture, use by date, consult instructions for use, factory symbol, hourglass symbol",
    guidance:
      "Look for an explicit symbol glossary or legend. Symbols used on artwork with no legend anywhere in the IFU is a minor improvement.",
  },
  {
    code: "CORE-IFU",
    category: "Instructions for Use",
    clauseRef: "MDR-2017 Third Schedule, Part II",
    title: "Instructions for Use supplied in English with mandatory content",
    requirementText:
      "Instructions for Use must accompany the device in English and must state the intended use and intended user, the operating instructions, all contraindications, warnings and precautions, the residual risks communicated to the user, the cleaning and maintenance instructions, the storage and transport conditions, the expected service life, and the contact details for reporting an adverse event or complaint in India.",
    keywords:
      "instructions for use,ifu,user manual,operating manual|intended use,indications for use|warning,caution,contraindication,precaution|cleaning,maintenance,storage",
    synonyms:
      "instructions for use, IFU, user manual, operating manual, directions for use, package insert, intended use, intended purpose, indications for use, intended user, contraindications, warnings, cautions, precautions, residual risk, cleaning, maintenance, storage conditions, transport conditions, service life, adverse event reporting, materiovigilance, complaint contact",
    guidance:
      "An IFU missing the India adverse-event contact route is very common and should be flagged as a minor improvement, not a pass.",
  },
  {
    code: "CORE-DMF",
    category: "Device Master File",
    clauseRef: "MDR-2017 Fourth Schedule, Part II r/w Rule 35",
    title: "Device Master File complete and indexed",
    requirementText:
      "The Device Master File must be submitted in the format of the Fourth Schedule and must be internally indexed. It must contain the executive summary, the device description and intended use, the manufacturing process and site details, the list of applied standards, the design and performance verification and validation data, the sterilisation validation where applicable, the stability/shelf-life data, the labelling and packaging set, and the post-market surveillance plan. Every document referenced in the index must actually be present in the dossier.",
    keywords:
      "device master file,dmf|index,table of contents,contents|device description,intended use|post-market,post market surveillance,pms,vigilance",
    synonyms:
      "Device Master File, DMF, technical file, technical documentation, design dossier, Fourth Schedule format, index, table of contents, executive summary, device description, manufacturing process, list of applied standards, verification and validation, shelf life, stability data, packaging, post-market surveillance, PMS plan, PSUR, vigilance procedure",
    guidance:
      "This clause is about completeness of the submission as a whole. An index that references annexes which are not in the bundle is exactly the failure mode this check exists to catch.",
  },
];

// ---------------------------------------------------------------------------
// DEVICE-SPECIFIC — 4 clauses per device type
// ---------------------------------------------------------------------------

const DEVICE_TYPES: {
  slug: string;
  name: string;
  riskClass: string;
  particularStandard: string;
  summary: string;
  clauses: SeedClause[];
}[] = [
  {
    slug: "digital-thermometer",
    name: "Digital Thermometer",
    riskClass: "A",
    particularStandard: "IEC 80601-2-56",
    summary:
      "Non-invasive clinical electronic thermometer for body temperature measurement. Lowest risk class under MDR-2017; notified as a Class A device.",
    clauses: [
      {
        code: "THERM-ACCURACY",
        category: "Performance Testing",
        clauseRef: "IEC 80601-2-56:2017+A1 cl. 201.12.1",
        title: "Clinical accuracy test report to IEC 80601-2-56",
        requirementText:
          "The dossier must contain a test report to IEC 80601-2-56, Particular requirements for basic safety and essential performance of clinical thermometers for body temperature measurement. The report must state the laboratory accuracy over the declared measurement range (typically ±0.1 °C to ±0.2 °C across 35.0–42.0 °C), the measurement range itself, the response time, and the clinical bias and limits of agreement determined from the clinical accuracy study.",
        keywords:
          "80601-2-56,iec 80601-2-56|accuracy,±0.1,±0.2,0.1 °c,0.2 °c,degrees|measurement range,range,35,42|test report,report no,clinical accuracy",
        synonyms:
          "IEC 80601-2-56, EN 80601-2-56, clinical thermometer standard, clinical electrical thermometer, laboratory accuracy, maximum permissible error, ±0.1 °C, ±0.2 °C, 0.1 degree, measurement range, 35.0 to 42.0, 35-42 °C, response time, clinical bias, limits of agreement, clinical accuracy study, clinical repeatability",
        guidance:
          "A laboratory accuracy figure alone is not enough for a clinical thermometer — IEC 80601-2-56 also requires clinical bias and limits of agreement from human subjects.",
      },
      {
        code: "THERM-SITE-MODE",
        category: "Labelling",
        clauseRef: "IEC 80601-2-56:2017 cl. 201.7.2.101 r/w MDR-2017 Third Schedule",
        title: "Declared measurement site and mode of operation on label and IFU",
        requirementText:
          "The label and Instructions for Use must state the body site for which the thermometer is validated (oral, axillary, rectal, tympanic or temporal), the mode of operation (direct mode or adjusted mode), and the measurement uncertainty applicable to that site. Where the device reports an adjusted-mode temperature, the reference body site to which the reading is adjusted must be declared.",
        keywords:
          "oral,axillary,rectal,tympanic,temporal,forehead,ear|adjusted mode,direct mode,mode of operation|instructions for use,ifu,label",
        synonyms:
          "measurement site, body site, oral, sublingual, axillary, underarm, rectal, tympanic, ear, temporal, forehead, adjusted mode, direct mode, mode of operation, reference body site, site-specific uncertainty, calibrated for, validated for use at",
        guidance:
          "A thermometer validated for axillary use but labelled generically as 'body temperature' understates its uncertainty — flag as a minor improvement requiring the site declaration.",
      },
      {
        code: "THERM-BATTERY",
        category: "Safety Testing",
        clauseRef: "IEC 62133-2:2017 r/w IEC 60601-1 cl. 15.4.3",
        title: "Battery safety certification for the internally powered supply",
        requirementText:
          "For an internally powered device, the dossier must include evidence of battery cell safety to IEC 62133-2 (or IEC 62133 for older submissions), the battery type and rating, and the IEC 60601-1 assessment of the internal power source including protection against excessive temperature and leakage. Where a coin cell is used and the device may be accessible to children, the coin-cell ingestion warning required by the IFU must be present.",
        keywords: "iec 62133,62133,battery safety|battery,cell,coin cell,lithium,alkaline|certificate,test report,report no",
        synonyms:
          "IEC 62133, IEC 62133-2, EN 62133, battery safety, cell safety certificate, secondary cell, primary cell, coin cell, button cell, CR2032, lithium cell, alkaline cell, LR41, battery compartment, internally powered equipment, internal electrical power source, ingestion hazard warning",
        guidance:
          "The battery cell certificate is usually a separate component certificate from the cell vendor. Its absence is a common gap for low-cost imported thermometers.",
      },
      {
        code: "THERM-BIOCOMPAT",
        category: "Biocompatibility",
        clauseRef: "ISO 10993-1:2018 r/w MDR-2017 First Schedule, Part I",
        title: "Biocompatibility evaluation of patient-contacting probe and probe covers",
        requirementText:
          "The probe tip and any probe cover that contacts the patient are surface-contacting devices with limited (≤24 h) contact duration and must be evaluated per ISO 10993-1. The dossier must include the biological evaluation plan and report, with cytotoxicity (ISO 10993-5), irritation and skin sensitisation (ISO 10993-10 / -23) data, or a justified equivalence argument to a previously evaluated material.",
        keywords:
          "iso 10993,10993,biocompatibility,biological evaluation|cytotoxicity,10993-5|irritation,sensitisation,sensitization,10993-10,10993-23",
        synonyms:
          "ISO 10993, ISO 10993-1, ISO 10993-5, ISO 10993-10, ISO 10993-23, biocompatibility, biological evaluation plan, biological evaluation report, BEP, BER, cytotoxicity, MTT assay, L929, irritation, intracutaneous reactivity, skin sensitisation, sensitization, guinea pig maximisation, surface-contacting device, limited contact duration, material equivalence",
        guidance:
          "Material equivalence arguments are acceptable but must name the predicate material and cite its data — an unsupported 'medical grade ABS' statement is not an evaluation.",
      },
    ],
  },
  {
    slug: "pulse-oximeter",
    name: "Pulse Oximeter",
    riskClass: "B",
    particularStandard: "ISO 80601-2-61",
    summary:
      "Non-invasive pulse oximeter equipment for continuous or spot-check measurement of functional oxygen saturation (SpO2). Class B under MDR-2017.",
    clauses: [
      {
        code: "OXI-SPO2-ACCURACY",
        category: "Performance Testing",
        clauseRef: "ISO 80601-2-61:2017 cl. 201.12.1.101",
        title: "SpO2 accuracy validation from a clinical desaturation study",
        requirementText:
          "SpO2 accuracy must be established by a controlled desaturation study in human volunteers against a CO-oximeter reference, as required by ISO 80601-2-61. The dossier must report the accuracy root-mean-square (ARMS) value over the declared saturation range (typically 70–100 %), the number of subjects and data pairs, the skin-pigmentation distribution of the subject cohort, and the Bland-Altman analysis. Bench simulator data alone does not satisfy this requirement.",
        keywords:
          "iso 80601-2-61,80601-2-61|arms,a rms,accuracy root mean square,spo2 accuracy|desaturation study,clinical study,co-oximeter,volunteers|70,100,saturation range",
        synonyms:
          "ISO 80601-2-61, EN ISO 80601-2-61, pulse oximeter equipment standard, ARMS, A rms, accuracy root mean square, root-mean-square error, SpO2 accuracy, controlled desaturation study, hypoxia study, human volunteer study, CO-oximeter, co-oximetry reference, arterial blood sample, SaO2, 70 % to 100 %, 70-100 percent saturation, Bland-Altman, skin pigmentation, Fitzpatrick, data pairs",
        guidance:
          "Look explicitly for ARMS with a numeric value (commonly ≤3 % for 70–100 %). A dossier that cites only an SpO2 simulator (e.g. a Fluke Index 2) has not met the clinical requirement — that is a REJECT-level substitution of evidence.",
      },
      {
        code: "OXI-LBL-ACCURACY",
        category: "Labelling",
        clauseRef: "ISO 80601-2-61:2017 cl. 201.12.1.102 r/w cl. 201.7.4.101",
        title: "Declared accuracy, saturation range and compatible probe list",
        requirementText:
          "The label and Instructions for Use must disclose the declared SpO2 accuracy (as ARMS) and the saturation range over which it applies, the pulse-rate range and accuracy, the wavelengths and maximum optical output power of the emitters, and an explicit list of the sensor/probe models validated for use with this monitor. The IFU must also state that the accuracy figure is not equivalent to measurement uncertainty of an individual reading.",
        keywords:
          "arms,accuracy|pulse rate,bpm,pulse rate accuracy|wavelength,nm,optical output|probe,sensor,compatible sensor,accessory list",
        synonyms:
          "declared accuracy, ARMS on label, saturation range, pulse rate range, bpm, beats per minute, pulse rate accuracy, wavelength, 660 nm, 905 nm, 940 nm, red and infrared, maximum optical output power, radiant power, mW, compatible sensors, approved probes, accessory list, validated sensor models, sensor compatibility table",
        guidance:
          "The compatible probe list is the item most often missing. Using an unvalidated third-party probe invalidates the accuracy claim, so an absent list is a genuine minor improvement.",
      },
      {
        code: "OXI-ALARM",
        category: "Safety Testing",
        clauseRef: "IEC 60601-1-8:2006+A1+A2 r/w ISO 80601-2-61 cl. 201.12.3",
        title: "Alarm system conformity to IEC 60601-1-8",
        requirementText:
          "Where the oximeter provides physiological or technical alarms, the alarm system must conform to IEC 60601-1-8. The dossier must include the alarm system test report covering alarm condition priorities, the audible and visual alarm signal characteristics, alarm limit setting and default limits, the alarm-off and audio-paused indications, and the alarm system delay. Spot-check oximeters that provide no alarms must carry an explicit declaration to that effect.",
        keywords:
          "iec 60601-1-8,60601-1-8,alarm system|alarm limit,alarm priority,high priority,medium priority|audible,visual,alarm signal",
        synonyms:
          "IEC 60601-1-8, EN 60601-1-8, alarm systems collateral standard, alarm condition, alarm priority, high priority alarm, medium priority alarm, low priority alarm, physiological alarm, technical alarm, alarm limits, default alarm limits, audible alarm, visual alarm signal, audio paused, alarm off, alarm silence, alarm system delay, no alarm declaration",
        guidance:
          "If the device genuinely has no alarm system, a written declaration of non-applicability is an acceptable pass. Silence on the topic is not.",
      },
      {
        code: "OXI-SOFTWARE",
        category: "Software Lifecycle",
        clauseRef: "IEC 62304:2006+A1:2015 r/w MDR-2017 First Schedule, Part I cl. 17",
        title: "IEC 62304 software lifecycle documentation and safety classification",
        requirementText:
          "The embedded software must be developed under a lifecycle process conforming to IEC 62304. The dossier must state the software safety classification (Class A, B or C) with its justification, and include the software development plan, software requirements specification, architecture, verification and validation results, the anomaly list with residual anomaly justification, and the SOUP (software of unknown provenance) inventory with its risk assessment.",
        keywords:
          "iec 62304,62304,software lifecycle|software safety classification,class a,class b,class c|verification,validation,software requirements|soup,software of unknown provenance,anomaly",
        synonyms:
          "IEC 62304, EN 62304, software lifecycle processes, medical device software, software safety classification, Class A software, Class B software, Class C software, software development plan, SDP, software requirements specification, SRS, software architecture, unit verification, integration testing, software validation, anomaly list, known anomalies, residual anomaly, SOUP, software of unknown provenance, third-party library, OTS software",
        guidance:
          "A SpO2 monitor whose software failure could produce a hazardous under-reading is normally Class B or C. A Class A claim with no justification should be challenged.",
      },
    ],
  },
  {
    slug: "bp-monitor",
    name: "Digital Blood Pressure Monitor (NIBP)",
    riskClass: "B",
    particularStandard: "IEC 80601-2-30",
    summary:
      "Automated non-invasive sphygmomanometer for intermittent measurement of arterial blood pressure using an occluding cuff. Class B under MDR-2017.",
    clauses: [
      {
        code: "BP-CUFF-PRESSURE",
        category: "Performance Testing",
        clauseRef: "IEC 80601-2-30:2018 cl. 201.12.1.101",
        title: "Cuff pressure measurement accuracy to IEC 80601-2-30",
        requirementText:
          "The dossier must contain a test report to IEC 80601-2-30 demonstrating cuff pressure indication accuracy within ±3 mmHg (or ±2 % of the reading, whichever is greater) across the full indicated pressure range, at the specified environmental conditions, and after the specified temperature and humidity conditioning. The report must state the pressure range tested, the reference manometer traceability, and the pass conclusion.",
        keywords:
          "iec 80601-2-30,80601-2-30|±3 mmhg,3 mmhg,±2 %,accuracy|cuff pressure,pressure range,mmhg|test report,report no,traceable,calibration",
        synonyms:
          "IEC 80601-2-30, EN 80601-2-30, automated non-invasive sphygmomanometer, NIBP standard, cuff pressure accuracy, pressure indication accuracy, ±3 mmHg, plus or minus 3 mmHg, 3 millimetres of mercury, ±2 %, 0.4 kPa, pressure transducer, reference manometer, traceable calibration, static pressure test, 0 to 300 mmHg",
        guidance:
          "±3 mmHg is the static transducer accuracy only — it is not evidence of clinical accuracy. That is a separate clause below.",
      },
      {
        code: "BP-CLINICAL-VALIDATION",
        category: "Performance Testing",
        clauseRef: "ISO 81060-2:2018+A1 r/w IEC 80601-2-30 cl. 201.12.1.102",
        title: "Clinical validation of the NIBP measurement algorithm to ISO 81060-2",
        requirementText:
          "The oscillometric measurement algorithm must be clinically validated against auscultatory reference observers per ISO 81060-2. The dossier must report the validation protocol used, the number of subjects and the arm-circumference and blood-pressure distribution of the cohort, and the criterion 1 and criterion 2 results (mean difference and standard deviation of differences against the reference) for both systolic and diastolic pressure.",
        keywords:
          "iso 81060-2,81060-2,clinical validation|criterion 1,criterion 2,mean difference,standard deviation|systolic,diastolic|subjects,cohort,arm circumference",
        synonyms:
          "ISO 81060-2, EN ISO 81060-2, clinical investigation of automated sphygmomanometers, clinical validation, validation protocol, AAMI protocol, ESH protocol, BHS protocol, auscultatory reference, trained observers, mercury reference, criterion 1, criterion 2, mean difference, standard deviation of differences, 5 mmHg, 8 mmHg, systolic, diastolic, SBP, DBP, subject cohort, 85 subjects",
        guidance:
          "This is the single most important performance clause for a BP monitor. A dossier with IEC 80601-2-30 bench data but no ISO 81060-2 clinical validation should be a REJECT.",
      },
      {
        code: "BP-CUFF-SIZE",
        category: "Labelling",
        clauseRef: "IEC 80601-2-30:2018 cl. 201.7.9.2.101 r/w MDR-2017 Third Schedule",
        title: "Cuff size range and intended patient population declared",
        requirementText:
          "The label, the cuff itself and the Instructions for Use must state the arm-circumference range for which each supplied cuff is validated, together with the range index marker on the cuff. The intended patient population (adult, paediatric, neonatal) must be declared, and where the device is not validated for a population — for example pregnancy, pre-eclampsia, arrhythmia or paediatric use — the IFU must state that limitation explicitly.",
        keywords:
          "cuff size,arm circumference,cm,range index|adult,paediatric,pediatric,neonatal,patient population|not validated,limitation,contraindication,arrhythmia,pregnancy",
        synonyms:
          "cuff size, cuff range, arm circumference, upper arm circumference, 22-32 cm, 22 to 32 centimetres, range index marker, index line, size marking, adult cuff, large adult cuff, paediatric, pediatric, child cuff, neonatal, patient population, intended population, not validated for, contraindicated in, arrhythmia, atrial fibrillation, pregnancy, pre-eclampsia",
        guidance:
          "Look for a numeric circumference range in centimetres per cuff. A single 'standard adult cuff' with no range is a minor improvement.",
      },
      {
        code: "BP-OVERPRESSURE",
        category: "Safety Testing",
        clauseRef: "IEC 80601-2-30:2018 cl. 201.12.4.103 & 201.101",
        title: "Maximum cuff pressure limit and automatic rapid deflation",
        requirementText:
          "The device must incorporate an independent means of limiting cuff pressure and must deflate the cuff automatically if the pressure limit or the maximum inflation time is exceeded. The dossier must demonstrate by test the maximum attainable cuff pressure under single-fault conditions, the over-pressure cut-off value, and the maximum duration for which the cuff can remain inflated before automatic rapid deflation occurs.",
        keywords:
          "over-pressure,overpressure,pressure limit,maximum cuff pressure|automatic deflation,rapid deflation,auto deflate|single fault,safety cut-off,cut off,timeout",
        synonyms:
          "over-pressure protection, overpressure cut-off, maximum cuff pressure, pressure limiting device, independent pressure limiter, 300 mmHg limit, automatic rapid deflation, auto deflate, fast exhaust, release valve, maximum inflation time, 180 seconds, inflation timeout, single fault condition, watchdog, safety cut-off",
        guidance:
          "Both protections must be evidenced: the pressure ceiling AND the inflation-time limit. Evidence of only one is a minor improvement.",
      },
    ],
  },
  {
    slug: "ecg-machine",
    name: "ECG Machine (resting, non-invasive)",
    riskClass: "B",
    particularStandard: "IEC 60601-2-25",
    summary:
      "Resting electrocardiograph acquiring the diagnostic ECG through non-invasive surface electrodes. Class B under MDR-2017.",
    clauses: [
      {
        code: "ECG-SIGNAL",
        category: "Performance Testing",
        clauseRef: "IEC 60601-2-25:2011 cl. 201.12.4",
        title: "ECG signal accuracy, frequency response and noise test report",
        requirementText:
          "The dossier must contain a test report to IEC 60601-2-25 covering the diagnostic ECG signal chain: amplitude and time measurement accuracy, the frequency and impulse response, input impedance, common-mode rejection, system noise referred to the input, the tall-T-wave and pacemaker-pulse rejection tests, and the baseline-wander and drift limits. The report must state the report number, the issuing laboratory and the pass conclusion for each test.",
        keywords:
          "iec 60601-2-25,60601-2-25|frequency response,input impedance,common mode rejection,cmrr|noise,baseline,drift|test report,report no,accuracy",
        synonyms:
          "IEC 60601-2-25, EN 60601-2-25, electrocardiograph standard, diagnostic ECG, resting ECG, amplitude accuracy, time measurement accuracy, frequency response, 0.05 Hz to 150 Hz, impulse response, input impedance, 10 megohm, common mode rejection, CMRR, system noise, 30 microvolt, noise referred to input, tall T-wave rejection, pacemaker pulse rejection, baseline wander, baseline drift",
        guidance:
          "IEC 60601-2-27 (monitoring ECG) is not a substitute for 60601-2-25 (diagnostic ECG). A dossier citing only 60601-2-27 for a diagnostic ECG machine should be flagged.",
      },
      {
        code: "ECG-DEFIB-CF",
        category: "Safety Testing",
        clauseRef: "IEC 60601-1:2005 cl. 8.5.5.1 r/w IEC 60601-2-25 cl. 201.8.5.5.1",
        title: "Defibrillation-proof Type CF applied part and electrode isolation",
        requirementText:
          "The patient connection of a diagnostic ECG must be a defibrillation-proof Type CF applied part. The dossier must evidence the defibrillation protection test (energy reduction and recovery time after a defibrillation pulse), the patient auxiliary current and patient leakage current measurements in normal and single-fault condition, and the corresponding Type CF and defibrillation-proof symbols on the label and equipment marking.",
        keywords:
          "type cf,cf applied part,defibrillation proof,defibrillation-proof|leakage current,patient auxiliary current,single fault|recovery time,defibrillation protection,5000 v,5 kv",
        synonyms:
          "Type CF, CF applied part, cardiac floating, defibrillation-proof, defibrillation proof applied part, defib-proof, defibrillation protection, energy reduction test, recovery time, 5000 V, 5 kV, patient leakage current, patient auxiliary current, normal condition, single fault condition, 10 microamps, 50 microamps, applied part symbol, paddle symbol",
        guidance:
          "Look for the defibrillation-proof CF symbol as well as the test data. A Type BF declaration on a diagnostic ECG is a substantive non-conformity, not a paperwork gap.",
      },
      {
        code: "ECG-ALGORITHM",
        category: "Software Lifecycle",
        clauseRef: "IEC 62304:2006+A1:2015 r/w IEC 60601-2-25 cl. 201.12.1.101",
        title: "Interpretive algorithm validation and IEC 62304 software documentation",
        requirementText:
          "Where the ECG provides automated measurement or interpretive statements, the dossier must include the validation of that algorithm against an annotated reference database (such as CSE or an equivalent expert-adjudicated set), reporting sensitivity and specificity or measurement bias per parameter, together with IEC 62304 software lifecycle documentation and the software safety classification. The IFU must state that interpretive statements are advisory and require overread by a qualified physician.",
        keywords:
          "iec 62304,62304,software lifecycle|interpretive,interpretation,algorithm validation,automated measurement|sensitivity,specificity,reference database,cse|overread,physician review,advisory",
        synonyms:
          "IEC 62304, software lifecycle, interpretive algorithm, interpretation statements, automated ECG interpretation, automated measurements, algorithm validation, annotated database, CSE database, CSE multilead, MIT-BIH, expert adjudicated, sensitivity, specificity, measurement bias, overread, physician overread, confirmation by a physician, advisory statement, not for diagnosis without review",
        guidance:
          "If the device makes no interpretive statements, a declaration of non-applicability plus the IEC 62304 file is a pass. If it does interpret and there is no algorithm validation, that is a REJECT.",
      },
      {
        code: "ECG-LEADS-BIOCOMPAT",
        category: "Biocompatibility",
        clauseRef: "ISO 10993-1:2018 r/w IEC 60601-2-25 cl. 201.7.2.101",
        title: "Electrode/lead-wire biocompatibility and standardised lead colour coding",
        requirementText:
          "Patient cables, lead wires and reusable electrodes are surface-contacting parts and require biological evaluation to ISO 10993-1, with cytotoxicity, irritation and sensitisation data or a justified equivalence. In addition the lead wires must follow one of the two colour-coding and labelling conventions permitted by IEC 60601-2-25, applied consistently on the cable, on the device and in the Instructions for Use, and lead connectors must be protected against inadvertent connection to mains.",
        keywords:
          "iso 10993,10993,biocompatibility,biological evaluation|lead wire,electrode,patient cable|colour code,color code,colour coding,lead identification,iec convention,aha,ahai",
        synonyms:
          "ISO 10993, ISO 10993-1, ISO 10993-5, ISO 10993-10, biocompatibility, biological evaluation, cytotoxicity, irritation, sensitisation, lead wires, patient cable, trunk cable, electrodes, reusable electrodes, colour coding, color code, lead identification, IEC convention, AHA convention, R L F C1 C6, RA LA LL V1, protected connector, mains connection hazard",
        guidance:
          "Mixing the IEC and AHA colour conventions across the cable, the device panel and the IFU is a real and common documentation gap — flag it as a minor improvement.",
      },
    ],
  },
  {
    slug: "nebulizer",
    name: "Nebulizer",
    riskClass: "A/B",
    particularStandard: "ISO 27427 / EN 13544-1",
    summary:
      "Compressor or mesh nebulizer converting liquid medication into an inhalable aerosol. Notified in the A/B band under MDR-2017 depending on the presentation and intended use.",
    clauses: [
      {
        code: "NEB-AEROSOL",
        category: "Performance Testing",
        clauseRef: "EN 13544-1:2007+A1 Annex CC",
        title: "Aerosol output, output rate and particle size distribution",
        requirementText:
          "The dossier must contain aerosol performance data determined per EN 13544-1 Annex CC using a cascade impactor: the aerosol output and output rate, the mass median aerodynamic diameter (MMAD), the geometric standard deviation, and the respirable fraction (proportion of the delivered dose below 5 µm). The test medication, fill volume and flow rate used for the measurement must be stated, since the declared performance is only valid for those conditions.",
        keywords:
          "en 13544-1,13544,aerosol output,output rate|mmad,mass median aerodynamic diameter,particle size,µm,micron|respirable fraction,cascade impactor,fill volume",
        synonyms:
          "EN 13544-1, EN 13544-1 Annex CC, ISO 27427, respiratory therapy equipment, aerosol output, output rate, ml/min, millilitres per minute, MMAD, mass median aerodynamic diameter, particle size distribution, droplet size, droplet distribution, micron, µm, micrometre, geometric standard deviation, GSD, respirable fraction, fine particle fraction, below 5 microns, cascade impactor, Next Generation Impactor, NGI, Andersen impactor, laser diffraction, fill volume, 2.5 ml charge",
        guidance:
          "A marketing claim such as 'particle size 0.5–5 µm' with no impactor data and no stated fill volume is not performance evidence — treat it as a minor improvement at best.",
      },
      {
        code: "NEB-COMPRESSOR",
        category: "Safety Testing",
        clauseRef: "ISO 27427:2013 r/w IEC 60601-1 cl. 9 & cl. 15 and EN 13544-1 cl. 7",
        title: "Compressor safety, duty cycle and acoustic noise declaration",
        requirementText:
          "For a compressor-driven nebulizer the dossier must evidence the mechanical and thermal safety of the compressor unit under continuous and intermittent operation, including accessible surface temperature limits, the declared duty cycle and maximum continuous operating time, protection against moving parts, and the A-weighted sound pressure level declared per the particular standard. Mesh nebulizers must instead evidence transducer thermal safety and the auto-shutoff on dry operation.",
        keywords:
          "compressor,mesh nebuliser,mesh nebulizer,transducer|duty cycle,continuous operation,operating time|surface temperature,thermal,overheat|noise,sound pressure,db(a),dba",
        synonyms:
          "compressor, piston compressor, diaphragm pump, mesh nebuliser, mesh nebulizer, vibrating mesh, piezoelectric transducer, duty cycle, intermittent operation, 30 min on 30 min off, maximum continuous operating time, thermal cut-out, thermal protector, accessible surface temperature, overheating, moving parts guard, sound pressure level, acoustic noise, dB(A), dBA, decibels, dry run protection, auto shut-off",
        guidance:
          "The duty cycle declaration matters clinically — a device rated '30 min on / 30 min off' that is labelled for continuous home use is a contradiction worth flagging.",
      },
      {
        code: "NEB-REPROCESSING",
        category: "Reprocessing",
        clauseRef: "ISO 17664-2:2021 r/w MDR-2017 Third Schedule, Part II",
        title: "Validated cleaning and disinfection instructions for reusable parts",
        requirementText:
          "The nebulizer chamber, mask, mouthpiece and tubing are reusable patient-contacting accessories. The dossier must contain validated reprocessing instructions per ISO 17664-2, stating the cleaning and disinfection method, the agents and concentrations, the number of validated reprocessing cycles, the permitted service life of each accessory, and the point at which accessories must be discarded. The instructions must also cover single-patient versus multi-patient use.",
        keywords:
          "cleaning,disinfection,reprocessing,iso 17664|validated,validation,cycles,number of cycles|replace,service life,discard,single patient,multi-patient",
        synonyms:
          "ISO 17664, ISO 17664-2, reprocessing instructions, processing of health care products, cleaning, manual cleaning, disinfection, thermal disinfection, chemical disinfection, boiling, autoclaving, steam sterilisation, disinfectant concentration, validated method, validation report, number of reprocessing cycles, 50 cycles, service life of accessory, replacement interval, discard after, single-patient use, multi-patient use, cross-contamination",
        guidance:
          "'Wash with warm soapy water' with no validation and no replacement interval is the typical gap here. Look for a validated method and an accessory replacement interval.",
      },
      {
        code: "NEB-GASPATH-BIOCOMPAT",
        category: "Biocompatibility",
        clauseRef: "ISO 18562 series r/w ISO 10993-1:2018",
        title: "Biocompatibility of the breathing gas pathway and patient-contact parts",
        requirementText:
          "The gas pathway of a nebulizer delivers aerosol directly to the respiratory tract and must be evaluated to the ISO 18562 series for particulate matter emission (18562-2), volatile organic compound emission (18562-3) and leachables in condensate (18562-4), in addition to ISO 10993 surface-contact evaluation of the mask and mouthpiece materials. The evaluation must identify every material in the gas pathway.",
        keywords:
          "iso 18562,18562,gas pathway,breathing gas|voc,volatile organic compound,particulate matter,leachable,condensate|iso 10993,10993,biocompatibility,mask,mouthpiece",
        synonyms:
          "ISO 18562, ISO 18562-1, ISO 18562-2, ISO 18562-3, ISO 18562-4, breathing gas pathway, gas pathway, biocompatibility of breathing gas pathways, particulate matter emission, PM2.5, PM10, volatile organic compounds, VOC emission, leachables, condensate analysis, ISO 10993, surface contact, mask, mouthpiece, medication cup, materials of construction, inhalation toxicology",
        guidance:
          "ISO 10993 surface-contact data alone does not cover the gas pathway. A dossier with only 10993 data for an inhalation device is a substantive gap.",
      },
    ],
  },
];

export { COMMON_CORE, DEVICE_TYPES };

// ---------------------------------------------------------------------------

async function main() {
  console.log("Seeding MDR-2017 rule library...");

  await prisma.finding.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.deviceType.deleteMany();

  let order = 0;
  for (const clause of COMMON_CORE) {
    await prisma.clause.create({
      data: {
        code: clause.code,
        deviceTypeId: null,
        category: clause.category,
        clauseRef: clause.clauseRef,
        title: clause.title,
        requirementText: clause.requirementText,
        mandatory: clause.mandatory ?? true,
        keywords: clause.keywords,
        synonyms: clause.synonyms,
        guidance: clause.guidance,
        sortOrder: order++,
      },
    });
  }
  console.log(`  ✓ ${COMMON_CORE.length} common-core clauses`);

  for (const device of DEVICE_TYPES) {
    const created = await prisma.deviceType.create({
      data: {
        slug: device.slug,
        name: device.name,
        riskClass: device.riskClass,
        particularStandard: device.particularStandard,
        summary: device.summary,
      },
    });

    let deviceOrder = 100;
    for (const clause of device.clauses) {
      await prisma.clause.create({
        data: {
          code: clause.code,
          deviceTypeId: created.id,
          category: clause.category,
          clauseRef: clause.clauseRef,
          title: clause.title,
          requirementText: clause.requirementText,
          mandatory: clause.mandatory ?? true,
          keywords: clause.keywords,
          synonyms: clause.synonyms,
          guidance: clause.guidance,
          sortOrder: deviceOrder++,
        },
      });
    }
    console.log(
      `  ✓ ${device.name} (Class ${device.riskClass}) — ${device.clauses.length} device-specific clauses`,
    );
  }

  const total = await prisma.clause.count();
  console.log(`\nDone. ${total} clauses across ${DEVICE_TYPES.length} device types.\n`);
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
