export type Verdict = "PASS" | "MINOR_IMPROVEMENT" | "REJECT";

export type DeviceType = {
  id: string;
  slug: string;
  name: string;
  riskClass: string;
  particularStandard: string;
  summary: string;
  specificClauseCount: number;
  commonCoreClauseCount: number;
  totalClauseCount: number;
  auditCount: number;
};

export type Clause = {
  id: string;
  deviceTypeId: string | null;
  deviceTypeName: string | null;
  scope: "COMMON_CORE" | "DEVICE_SPECIFIC";
  category: string;
  clauseRef: string;
  title: string;
  requirementText: string;
  guidance: string;
  mandatory: boolean;
};

export type VerdictCounts = Record<Verdict, number>;

export type AuditSummaryRow = {
  id: string;
  createdAt: string;
  dossierFilename: string;
  overallResult: Verdict;
  engine: string;
  submittedBy: string;
  deviceType: { id: string; name: string; riskClass: string };
  counts: VerdictCounts;
  clauseCount: number;
  overriddenCount: number;
};

export type Finding = {
  id: string;
  aiVerdict: Verdict;
  aiConfidence: number;
  aiEvidenceSnippet: string;
  aiEvidenceKind: "lexical" | "semantic" | "none";
  aiFixNote: string;
  aiEngine: string;
  reviewerVerdict: Verdict | null;
  reviewerComment: string | null;
  reviewedAt: string | null;
  effectiveVerdict: Verdict;
  clause: {
    id: string;
    category: string;
    clauseRef: string;
    title: string;
    requirementText: string;
    guidance: string;
    mandatory: boolean;
    scope: "COMMON_CORE" | "DEVICE_SPECIFIC";
  };
};

export type AuditDetail = {
  id: string;
  createdAt: string;
  dossierFilename: string;
  status: string;
  overallResult: Verdict;
  engine: string;
  submittedBy: string;
  deviceType: DeviceType;
  counts: VerdictCounts;
  dossierPreview: string;
  dossierLength: number;
  findings: Finding[];
};

export type EvaluationSummary = {
  matcher: string;
  generatedAt: string;
  heldOut: {
    n: number;
    accuracy: number;
    macroF1: number;
    nonCompliance: { precision: number; recall: number; f1: number; support: number; truePositives: number; falsePositives: number; falseNegatives: number };
    perClass: Record<Verdict, { precision: number; recall: number; f1: number; support: number }>;
    byRelationship: Record<string, { n: number; accuracy: number; predictedPass: number }>;
  };
  dossiers: { judged: number; overallCorrect: number };
  floorMet?: boolean;
  precisionFloor?: number;
  thresholds?: { covPass: number; tauPass: number; tauSoften: number; tauContext: number };
  fallbackRule?: string | null;
  coverage?: { answered: number; missing: number; total: number };
  model?: string | null;
};

export type DashboardSummary = {
  totalAudits: number;
  passRate: number;
  resultTotals: VerdictCounts;
  topGaps: { title: string; clauseRef: string; category: string; count: number }[];
  recent: {
    id: string;
    createdAt: string;
    dossierFilename: string;
    overallResult: Verdict;
    deviceTypeName: string;
    counts: VerdictCounts;
  }[];
  engine: { llmConfigured: boolean; model: string | null };
};
