import { apiClient, authFetch } from "@/lib/api/api-client";
import { ApiError } from "@/lib/query/query-client";
import type {
  ArrearsReport,
  CashBookReport,
  ContributionMatrixReport,
  GroupDashboardReport,
  LoanPortfolioReport,
  MemberStatementReport,
  ShareOutReport,
  UserDashboard,
} from "@/types/reports";


export type ReportRange = { from?: string; to?: string };

function qs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const g = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/reports`;

export const reportPaths = {
  statement: (groupId: string, userId = "me", r: ReportRange = {}) => `${g(groupId)}/members/${userId}/statement${qs(r)}`,
  matrix: (groupId: string, r: ReportRange & { fund?: string } = {}) => `${g(groupId)}/contribution-matrix${qs(r)}`,
  arrears: (groupId: string) => `${g(groupId)}/arrears`,
  portfolio: (groupId: string, r: ReportRange = {}) => `${g(groupId)}/loan-portfolio${qs(r)}`,
  cashBook: (groupId: string, r: ReportRange & { fund?: string } = {}) => `${g(groupId)}/cash-book${qs(r)}`,
  shareOut: (groupId: string, cycleId: string) => `${g(groupId)}/cycles/${encodeURIComponent(cycleId)}/share-out`,
  receipt: (groupId: string, depositId: string) => `${g(groupId)}/receipts/${encodeURIComponent(depositId)}`,
  dashboard: (groupId: string) => `${g(groupId)}/dashboard`,
};

export const fetchUserDashboard = async () => (await apiClient.get("/users/me/finance/dashboard")) as unknown as UserDashboard;
export const fetchGroupDashboard = async (groupId: string) =>
  (await apiClient.get(reportPaths.dashboard(groupId))) as unknown as GroupDashboardReport;
export const fetchStatement = async (groupId: string, r: ReportRange) =>
  (await apiClient.get(reportPaths.statement(groupId, "me", r))) as unknown as MemberStatementReport;
export const fetchMatrix = async (groupId: string, r: ReportRange & { fund?: string }) =>
  (await apiClient.get(reportPaths.matrix(groupId, r))) as unknown as ContributionMatrixReport;
export const fetchArrears = async (groupId: string) =>
  (await apiClient.get(reportPaths.arrears(groupId))) as unknown as ArrearsReport;
export const fetchPortfolio = async (groupId: string, r: ReportRange) =>
  (await apiClient.get(reportPaths.portfolio(groupId, r))) as unknown as LoanPortfolioReport;
export const fetchCashBook = async (groupId: string, r: ReportRange & { fund?: string }) =>
  (await apiClient.get(reportPaths.cashBook(groupId, r))) as unknown as CashBookReport;
export const fetchShareOut = async (groupId: string, cycleId: string) =>
  (await apiClient.get(reportPaths.shareOut(groupId, cycleId))) as unknown as ShareOutReport;
export const fetchCycles = async (groupId: string) =>
  (await apiClient.get(`/groups/${encodeURIComponent(groupId)}/accounting/cycles`)) as unknown as {
    id: string;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  }[];

/** Download a CSV / PDF report (authenticated) and save it with the server's filename. */
export async function downloadReport(path: string, format: "csv" | "pdf") {
  const sep = path.includes("?") ? "&" : "?";
  const res = await authFetch(`${path}${sep}format=${format}`);
  if (!res.ok) {
    let message = `Download failed (${res.status})`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body?.message) message = Array.isArray(body.message) ? body.message.join(", ") : body.message;
    } catch {
      /* not JSON */
    }
    throw new ApiError(res.status, message, undefined);
  }
  const blob = await res.blob();
  const disp = res.headers.get("content-disposition") ?? "";
  const filename = /filename="([^"]+)"/.exec(disp)?.[1] ?? `report.${format}`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
