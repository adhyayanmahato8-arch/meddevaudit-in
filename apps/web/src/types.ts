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
