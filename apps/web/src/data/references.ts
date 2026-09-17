/**
 * Every rule, form, guidance document and standard the clause library cites,
 * with a link to the authoritative source. All URLs were fetched and verified
 * on 2026-09-17; ISO/IEC catalogue pages were confirmed through their own
 * search listings because iso.org blocks scripted requests.
 *
 * `access`:
 *   free      — the full document is a free download from the issuer
 *   catalogue — the issuer's catalogue page; the standard itself is a paid
 *               publication (ISO/IEC do not publish standards free of charge)
 *   portal    — a web application, not a document
 */
export type ReferenceKind = "rules" | "notification" | "form" | "guidance" | "portal" | "standard";

export type Reference = {
  id: string;
  kind: ReferenceKind;
  designation: string;
  title: string;
  issuer: string;
  url: string;
  access: "free" | "catalogue" | "portal";
  note?: string;
  /** Clause codes in the rule library that rest on this document. */
  citedBy: string[];
};

export const REFERENCE_SECTIONS: { id: string; title: string; blurb: string; items: Reference[] }[] = [
  {
    id: "india",
    title: "Indian law and CDSCO notifications",
    blurb:
      "The primary legislation the auditor screens against. The Medical Devices Rules, 2017 are made under the Drugs and Cosmetics Act, 1940 and are administered by the Central Drugs Standard Control Organisation (CDSCO).",
    items: [
      {
        id: "mdr-2017",
        kind: "rules",
        designation: "G.S.R. 78(E), 31 January 2017",
        title: "Medical Devices Rules, 2017 — full text as published",
        issuer: "Ministry of Health & Family Welfare / CDSCO",
        url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2022/m_device/Medical%20Devices%20Rules,%202017.pdf",
        access: "free",
        note: "Chapter IV (import), Rule 35–36 (Forms MD-14 / MD-15), Third Schedule (labelling), Fourth Schedule (Device Master File), Fifth Schedule (QMS). ~3.3 MB.",
        citedBy: [
          "CORE-MD15-LICENCE",
          "CORE-MD14-AGENT",
          "CORE-FSC",
          "CORE-ISO13485",
          "CORE-ISO14971",
          "CORE-IEC60601-1",
          "CORE-EMC",
          "CORE-LBL-MFR",
          "CORE-LBL-IMPORTER",
          "CORE-LBL-BILINGUAL",
          "CORE-LBL-SYMBOLS",
          "CORE-IFU",
          "CORE-DMF",
        ],
      },
      {
        id: "cdsco-mdr-page",
        kind: "rules",
        designation: "CDSCO — Acts and Rules",
        title: "Medical Devices Rules: amendments, notifications and circulars",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/opencms/en/Acts-and-rules/Medical-Devices-Rules/",
        access: "portal",
        note: "The maintained list of every amendment to MDR-2017, including the Medical Devices (Amendment) Rules, 2020 (G.S.R. 102(E)) that brought all devices under registration.",
        citedBy: ["CORE-MD15-LICENCE", "CORE-DMF"],
      },
      {
        id: "classification",
        kind: "notification",
        designation: "CDSCO classification list",
        title: "Classification of medical devices under MDR-2017 (Class A / B / C / D)",
        issuer: "CDSCO",
        url: "https://www.cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/medical-device/Classificationg1.pdf",
        access: "free",
        note: "The risk-class assignments the five device types in this tool carry. ~10 MB.",
        citedBy: [],
      },
      {
        id: "regulatory-pathway",
        kind: "guidance",
        designation: "CDSCO guidance",
        title: "Regulatory pathway to be followed for medical devices under MDR-2017",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/medical-device/RegulatoryMDR-2017.pdf",
        access: "free",
        citedBy: ["CORE-MD15-LICENCE", "CORE-MD14-AGENT"],
      },
      {
        id: "faq",
        kind: "guidance",
        designation: "CDSCO FAQ",
        title: "Frequently asked questions on the Medical Devices Rules, 2017",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/MDfAq24.pdf",
        access: "free",
        citedBy: [],
      },
      {
        id: "samd-draft",
        kind: "guidance",
        designation: "Draft guidance, 21 October 2025",
        title: "Draft guidance document on Medical Device Software",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/resources/UploadCDSCOWeb/2018/UploadPublic_NoticesFiles/Draft%20guidance%20document%20on%20Medical%20Device%20Software%2021%2010%202025.pdf",
        access: "free",
        note: "Draft — not yet in force. Relevant to the software-lifecycle clauses.",
        citedBy: ["OXI-SOFTWARE", "ECG-ALGORITHM"],
      },
    ],
  },
  {
    id: "forms",
    title: "Import licence forms and procedure",
    blurb: "The application (MD-14) and the licence (MD-15) that the licensing clauses look for, and the checklist CDSCO applies to an import application.",
    items: [
      {
        id: "form-md14",
        kind: "form",
        designation: "Form MD-14",
        title: "Application for grant of licence to import medical devices — specimen form",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/medical-device/FormMD14n.pdf",
        access: "free",
        citedBy: ["CORE-MD14-AGENT"],
      },
      {
        id: "md15-checklist",
        kind: "guidance",
        designation: "CDSCO checklist",
        title: "Checklist for the grant of import licence in Form MD-15 — required documents",
        issuer: "CDSCO",
        url: "https://cdsco.gov.in/opencms/export/sites/CDSCO_WEB/Pdf-documents/medical-device/14MD.pdf",
        access: "free",
        note: "Covering letter, Form MD-14, fee challan, power of attorney, wholesale/manufacturing licence, Free Sale Certificate, ISO 13485, Device Master File — the document set the common-core clauses screen for.",
        citedBy: ["CORE-MD15-LICENCE", "CORE-MD14-AGENT", "CORE-FSC", "CORE-ISO13485", "CORE-DMF"],
      },
      {
        id: "sugam",
        kind: "portal",
        designation: "SUGAM / Online MD portal",
        title: "CDSCO online portal for medical device licence applications",
        issuer: "CDSCO",
        url: "https://cdscomdonline.gov.in/NewMedDev/Homepage",
        access: "portal",
        note: "Where Form MD-14 is actually filed by the Indian authorised agent.",
        citedBy: ["CORE-MD14-AGENT"],
      },
    ],
  },
  {
    id: "vigilance",
    title: "Post-market vigilance",
    blurb: "The national adverse-event route the Instructions for Use and the Device Master File must point to.",
    items: [
      {
        id: "mvpi",
        kind: "portal",
        designation: "MvPI",
        title: "Materiovigilance Programme of India — Indian Pharmacopoeia Commission",
        issuer: "IPC (National Coordination Centre) with CDSCO",
        url: "https://www.ipc.gov.in/mandates/materiovigilance-programme-of-india-mvpi/about-us.html",
        access: "portal",
        citedBy: ["CORE-IFU", "CORE-DMF"],
      },
    ],
  },
  {
    id: "standards",
    title: "International standards cited by the clauses",
    blurb:
      "ISO and IEC standards are paid publications; the links go to the issuer's catalogue page, which gives the scope, edition and status. Indian adoptions (IS 13450 series for IEC 60601, etc.) are published by the Bureau of Indian Standards.",
    items: [
      {
        id: "iso-13485",
        kind: "standard",
        designation: "ISO 13485:2016",
        title: "Medical devices — Quality management systems — Requirements for regulatory purposes",
        issuer: "ISO",
        url: "https://www.iso.org/standard/59752.html",
        access: "catalogue",
        citedBy: ["CORE-ISO13485"],
      },
      {
        id: "iso-14971",
        kind: "standard",
        designation: "ISO 14971:2019",
        title: "Medical devices — Application of risk management to medical devices",
        issuer: "ISO",
        url: "https://www.iso.org/standard/72704.html",
        access: "catalogue",
        citedBy: ["CORE-ISO14971"],
      },
      {
        id: "iec-60601-1",
        kind: "standard",
        designation: "IEC 60601-1:2005 (+A1:2012, +A2:2020)",
        title: "Medical electrical equipment — Part 1: General requirements for basic safety and essential performance",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/2606",
        access: "catalogue",
        citedBy: ["CORE-IEC60601-1", "THERM-BATTERY", "ECG-DEFIB-CF", "NEB-COMPRESSOR"],
      },
      {
        id: "iec-60601-1-2",
        kind: "standard",
        designation: "IEC 60601-1-2:2014 (+A1:2020)",
        title: "Part 1-2: Collateral standard — Electromagnetic disturbances — Requirements and tests",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/2590",
        access: "catalogue",
        citedBy: ["CORE-EMC"],
      },
      {
        id: "iec-60601-1-8",
        kind: "standard",
        designation: "IEC 60601-1-8:2006 (+A1:2012, +A2:2020)",
        title: "Part 1-8: Collateral standard — Alarm systems in medical electrical equipment",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/2599",
        access: "catalogue",
        citedBy: ["OXI-ALARM"],
      },
      {
        id: "iso-15223-1",
        kind: "standard",
        designation: "ISO 15223-1:2021",
        title: "Medical devices — Symbols to be used with information to be supplied by the manufacturer — Part 1",
        issuer: "ISO",
        url: "https://www.iso.org/standard/77326.html",
        access: "catalogue",
        citedBy: ["CORE-LBL-SYMBOLS"],
      },
      {
        id: "iso-10993-1",
        kind: "standard",
        designation: "ISO 10993-1:2018",
        title: "Biological evaluation of medical devices — Part 1: Evaluation and testing within a risk management process",
        issuer: "ISO",
        url: "https://www.iso.org/standard/68936.html",
        access: "catalogue",
        citedBy: ["THERM-BIOCOMPAT", "ECG-LEADS-BIOCOMPAT", "NEB-GASPATH-BIOCOMPAT"],
      },
      {
        id: "iec-62304",
        kind: "standard",
        designation: "IEC 62304:2006 (+A1:2015)",
        title: "Medical device software — Software life cycle processes",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/6792",
        access: "catalogue",
        citedBy: ["OXI-SOFTWARE", "ECG-ALGORITHM"],
      },
      {
        id: "iso-80601-2-56",
        kind: "standard",
        designation: "ISO 80601-2-56:2017 (+A1:2018)",
        title: "Part 2-56: Particular requirements — clinical thermometers for body temperature measurement",
        issuer: "ISO/IEC (joint)",
        url: "https://www.iso.org/standard/67348.html",
        access: "catalogue",
        note: "A joint ISO/IEC standard; the clause library cites it as IEC 80601-2-56. Also listed on the IEC webstore as publication 27963.",
        citedBy: ["THERM-ACCURACY", "THERM-SITE-MODE"],
      },
      {
        id: "iec-62133-2",
        kind: "standard",
        designation: "IEC 62133-2:2017",
        title: "Secondary cells and batteries — Safety requirements for portable sealed cells — Part 2: Lithium systems",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/32662",
        access: "catalogue",
        citedBy: ["THERM-BATTERY"],
      },
      {
        id: "iso-80601-2-61",
        kind: "standard",
        designation: "ISO 80601-2-61:2017",
        title: "Part 2-61: Particular requirements — pulse oximeter equipment",
        issuer: "ISO",
        url: "https://www.iso.org/standard/67963.html",
        access: "catalogue",
        citedBy: ["OXI-SPO2-ACCURACY", "OXI-LBL-ACCURACY", "OXI-ALARM"],
      },
      {
        id: "iec-80601-2-30",
        kind: "standard",
        designation: "IEC 80601-2-30:2018",
        title: "Part 2-30: Particular requirements — automated non-invasive sphygmomanometers",
        issuer: "IEC/ISO (joint)",
        url: "https://www.iso.org/standard/70653.html",
        access: "catalogue",
        note: "Also on the IEC webstore as publication 62878 (redline version).",
        citedBy: ["BP-CUFF-PRESSURE", "BP-CUFF-SIZE", "BP-OVERPRESSURE"],
      },
      {
        id: "iso-81060-2",
        kind: "standard",
        designation: "ISO 81060-2:2018 (+A1:2020, +A2:2024)",
        title: "Non-invasive sphygmomanometers — Part 2: Clinical investigation of intermittent automated measurement type",
        issuer: "ISO",
        url: "https://www.iso.org/standard/73339.html",
        access: "catalogue",
        citedBy: ["BP-CLINICAL-VALIDATION"],
      },
      {
        id: "iec-60601-2-25",
        kind: "standard",
        designation: "IEC 60601-2-25:2011",
        title: "Part 2-25: Particular requirements — electrocardiographs",
        issuer: "IEC",
        url: "https://webstore.iec.ch/publication/2636",
        access: "catalogue",
        citedBy: ["ECG-SIGNAL", "ECG-DEFIB-CF", "ECG-LEADS-BIOCOMPAT"],
      },
      {
        id: "iso-27427",
        kind: "standard",
        designation: "ISO 27427:2013 (current edition ISO 27427:2023)",
        title: "Anaesthetic and respiratory equipment — Nebulizing systems and components",
        issuer: "ISO",
        url: "https://www.iso.org/standard/59482.html",
        access: "catalogue",
        note: "EN 13544-1:2007+A1:2009, which the aerosol clause cites for its Annex CC method, was withdrawn and superseded by EN ISO 27427. The 2023 edition is at iso.org/standard/78542.html.",
        citedBy: ["NEB-AEROSOL", "NEB-COMPRESSOR"],
      },
      {
        id: "iso-17664-2",
        kind: "standard",
        designation: "ISO 17664-2:2021",
        title: "Processing of health care products — Information to be provided by the manufacturer — Part 2: Non-critical medical devices",
        issuer: "ISO",
        url: "https://www.iso.org/standard/74152.html",
        access: "catalogue",
        citedBy: ["NEB-REPROCESSING"],
      },
      {
        id: "iso-18562-1",
        kind: "standard",
        designation: "ISO 18562-1:2017 (current edition 2024)",
        title: "Biocompatibility evaluation of breathing gas pathways in healthcare applications — Part 1",
        issuer: "ISO",
        url: "https://www.iso.org/standard/62892.html",
        access: "catalogue",
        note: "All parts of ISO 18562 were revised in 2024; the 2024 edition of Part 1 is at iso.org/standard/83409.html.",
        citedBy: ["NEB-GASPATH-BIOCOMPAT"],
      },
    ],
  },
];

/** Real, publicly available documents suitable for exercising the auditor. */
export type TestDocument = {
  title: string;
  kind: "510(k) summary" | "Instructions for Use" | "EU Declaration of Conformity" | "Specification";
  device: string;
  url: string;
  pages: number;
  expected: string;
};

export const TEST_DOCUMENTS: TestDocument[] = [
  { title: "FDA 510(k) K172366 — MD300W wrist pulse oximeter (Beijing Choice)", kind: "510(k) summary", device: "Pulse Oximeter", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf17/K172366.pdf", pages: 15, expected: "REJECT — technical clauses partly satisfied (SpO2 accuracy, alarms, software); all Indian licensing and labelling clauses absent." },
  { title: "FDA 510(k) K131111 — PO3M wireless pulse oximeter", kind: "510(k) summary", device: "Pulse Oximeter", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf13/K131111.pdf", pages: 8, expected: "REJECT — see above; a shorter summary, fewer technical hits." },
  { title: "FDA 510(k) K130947 — pulse oximeter", kind: "510(k) summary", device: "Pulse Oximeter", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf13/K130947.pdf", pages: 13, expected: "REJECT on Indian clauses; useful for comparing two oximeter summaries." },
  { title: "Nonin Onyx Vantage 9590 — Instructions for Use", kind: "Instructions for Use", device: "Pulse Oximeter", url: "https://www.nonin.com/wp-content/uploads/2018/09/Instructions-for-Use-9590.pdf", pages: 8, expected: "IFU, symbols, declared accuracy and EMC-table clauses tend to PASS or MINOR; licensing REJECT." },
  { title: "Nonin Onyx Vantage 9590 — specification sheet", kind: "Specification", device: "Pulse Oximeter", url: "https://www.nonin.com/wp-content/uploads/2018/09/Onyx-Vantage-Spec-Sheet.pdf", pages: 2, expected: "Mostly REJECT — a marketing sheet is not evidence; good for demonstrating that." },
  { title: "Philips IntelliVue pulse-oximetry — EU Declaration of Conformity", kind: "EU Declaration of Conformity", device: "Pulse Oximeter", url: "https://www.documents.philips.com/assets/EU%20Declaration%20of%20conformity/20240802/384917f3ac644e008f5fb1c000822749.pdf?feed=ifu_docs_feed", pages: 3, expected: "ISO 13485 / standards-list clauses register; shows why a DoC is not a Free Sale Certificate (CORE-FSC → REJECT)." },
  { title: "FDA 510(k) K250231 — automatic upper-arm BP monitor (Dongguan E-test)", kind: "510(k) summary", device: "Digital BP Monitor", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf25/K250231.pdf", pages: 10, expected: "REJECT overall; IEC 80601-2-30 and ISO 81060-2 clauses often PASS/MINOR." },
  { title: "FDA 510(k) K202372 — upper-arm BP monitor", kind: "510(k) summary", device: "Digital BP Monitor", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf20/K202372.pdf", pages: 12, expected: "REJECT overall; compare cuff-size and population declarations." },
  { title: "FDA 510(k) K183491 — BP monitor", kind: "510(k) summary", device: "Digital BP Monitor", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf18/K183491.pdf", pages: 9, expected: "REJECT overall." },
  { title: "FDA 510(k) K223044 — digital thermometer QT001 (Joytech)", kind: "510(k) summary", device: "Digital Thermometer", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf22/K223044.pdf", pages: 9, expected: "REJECT overall; ISO 80601-2-56 accuracy clause may reach MINOR." },
  { title: "FDA 510(k) K191570 — infrared thermometer MD-H30", kind: "510(k) summary", device: "Digital Thermometer", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf19/K191570.pdf", pages: 7, expected: "REJECT overall; note the measurement-site clause." },
  { title: "FDA 510(k) K203786 — GE MAC 7 resting ECG analysis system", kind: "510(k) summary", device: "ECG Machine", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf20/K203786.pdf", pages: 7, expected: "REJECT overall; interpretive-algorithm and IEC 60601-2-25 clauses register." },
  { title: "FDA 510(k) K141946 — Biocare digital electrocardiograph", kind: "510(k) summary", device: "ECG Machine", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf14/K141946.pdf", pages: 8, expected: "REJECT overall." },
  { title: "FDA 510(k) K131262 — digital electrocardiographs", kind: "510(k) summary", device: "ECG Machine", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf13/K131262.pdf", pages: 8, expected: "REJECT overall." },
  { title: "FDA 510(k) K191270 — PARI Proneb Max compressor", kind: "510(k) summary", device: "Nebulizer", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf19/K191270.pdf", pages: 7, expected: "REJECT overall; compressor-safety clause may reach MINOR." },
  { title: "FDA 510(k) K192633 — compressor nebulizer", kind: "510(k) summary", device: "Nebulizer", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf19/K192633.pdf", pages: 10, expected: "REJECT overall; check the aerosol-performance clause." },
  { title: "FDA 510(k) K141140 — nebulizer", kind: "510(k) summary", device: "Nebulizer", url: "https://www.accessdata.fda.gov/cdrh_docs/pdf14/K141140.pdf", pages: 9, expected: "REJECT overall." },
  { title: "Omron NE-C801 compressor nebulizer — instruction manual (US)", kind: "Instructions for Use", device: "Nebulizer", url: "https://omronhealthcare.com/storage/pdfs/im_nec801sz_5332875-4d.pdf", pages: 32, expected: "IFU, cleaning/reprocessing, symbols and duty-cycle clauses tend to PASS or MINOR; licensing REJECT. The longest real document here (~42,000 characters)." },
  { title: "Omron NE-C801 compressor nebulizer — instruction manual (Asia-Pacific)", kind: "Instructions for Use", device: "Nebulizer", url: "https://www.omronhealthcare-ap.com/Content/uploads/products/1da0ea24a3e64062b21f8c359b7e89c3.pdf", pages: 31, expected: "As above; a second edition of the same manual for comparison." },
  { title: "WHO MEDEVIS — pulse oximeter technical specification", kind: "Specification", device: "Pulse Oximeter", url: "https://medevis.who-healthtechnologies.org/files/attachments/0PJtGbtJuJ2BViyREhZ4ddZnVuxGMapET8rxRx8T.pdf", pages: 1, expected: "A procurement specification, not a submission — nearly everything REJECTs; illustrates the difference." },
];
