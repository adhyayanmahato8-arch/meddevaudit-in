import type {
  AuditDetail,
  AuditSummaryRow,
  Clause,
  DashboardSummary,
  DeviceType,
  Verdict,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

export const api = {
  health: () =>
    request<{
      ok: boolean;
      engine: string;
      model: string | null;
      retrieval: {
        mode: "hybrid" | "lexical";
        alpha: number;
        embeddingModel: string;
        embeddedClauses: number;
        totalClauses: number;
        modelState: string;
        modelError: string | null;
      };
    }>("/api/health"),

  deviceTypes: () => request<DeviceType[]>("/api/device-types"),

  clauses: (deviceTypeId?: string) =>
    request<Clause[]>(`/api/clauses${deviceTypeId ? `?deviceTypeId=${encodeURIComponent(deviceTypeId)}` : ""}`),

  audits: () => request<AuditSummaryRow[]>("/api/audits"),

  summary: () => request<DashboardSummary>("/api/audits/summary"),

  audit: (id: string) => request<AuditDetail>(`/api/audits/${id}`),

  createAudit: (input: { deviceTypeId: string; files: File[]; text: string }) => {
    const form = new FormData();
    form.append("deviceTypeId", input.deviceTypeId);
    for (const file of input.files) form.append("files", file);
    if (input.text.trim()) {
      form.append("text", input.text);
      form.append("filename", "Pasted dossier text");
    }
    return request<{
      id: string;
      overallResult: Verdict;
      engine: string;
      clausesScreened: number;
      notes: string[];
    }>("/api/audits", { method: "POST", body: form });
  },

  overrideFinding: (
    auditId: string,
    findingId: string,
    payload: { reviewerVerdict?: Verdict | null; reviewerComment?: string },
  ) =>
    request<{
      overallResult: Verdict;
      counts: Record<Verdict, number>;
      finding: { id: string; reviewerVerdict: Verdict | null; reviewerComment: string | null };
    }>(`/api/audits/${auditId}/findings/${findingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  exportUrl: (auditId: string) => `/api/audits/${auditId}/export`,
};
