import { apiClient, refreshSession, tokenStorage } from "@/lib/api/api-client";
import type {
  AdminGroupDetail,
  AdminGroupsPage,
  AdminUserDetail,
  AdminUsersPage,
  AuditRow,
  ImpersonationResponse,
  Paged,
  PaymentAccount,
  PlatformMetrics,
  PlatformSettings,
} from "@/types/admin";
import type { JsonObject } from "@/types/json";

export function qs(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

const get = async <T>(p: string) => (await apiClient.get(p)) as unknown as T;
const post = async <T>(p: string, body?: JsonObject) => (await apiClient.post(p, body ?? {})) as unknown as T;

// ── users
export type UsersFilter = { search?: string; status?: string; role?: string; page?: number; pageSize?: number };
export const fetchAdminUsers = (f: UsersFilter) => get<AdminUsersPage>(`/admin/users${qs(f)}`);
export const fetchAdminUser = (id: string) => get<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`);
export const suspendUser = (id: string, reason: string) => post<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason });
export const reactivateUser = (id: string) => post<AdminUserDetail>(`/admin/users/${id}/reactivate`);
export const unlockUser = (id: string) => post<AdminUserDetail>(`/admin/users/${id}/unlock`);
export const resetUserAccess = (id: string, sendResetEmail: boolean) =>
  post<{ message: string; resetEmailSent: boolean }>(`/admin/users/${id}/reset-access`, { sendResetEmail });
export const resendUserVerification = (id: string) => post<{ message: string }>(`/admin/users/${id}/resend-verification`);
export const verifyUserEmail = (id: string) => post<AdminUserDetail>(`/admin/users/${id}/verify-email`);
export const impersonateUser = (id: string) => post<ImpersonationResponse>(`/admin/users/${id}/impersonate`);

// ── groups
export type GroupsFilter = { search?: string; verification?: string; deleted?: string; page?: number; pageSize?: number };
export const fetchAdminGroups = (f: GroupsFilter) => get<AdminGroupsPage>(`/admin/groups${qs(f)}`);
export const fetchAdminGroup = (id: string) => get<AdminGroupDetail>(`/admin/groups/${encodeURIComponent(id)}`);
export const verifyGroup = (id: string) => apiClient.patch(`/groups/${id}/verify`, {});
export const rejectGroupVerification = (id: string, reason: string) =>
  apiClient.patch(`/groups/${id}/verification/reject`, { reason });
export const restoreGroup = (id: string) => apiClient.patch(`/groups/${id}/restore`, {});
export const savePaymentAccount = async (groupId: string, body: JsonObject) =>
  (await apiClient.put(`/admin/groups/${groupId}/payment-account`, body)) as unknown as PaymentAccount;
export const removePaymentAccount = (groupId: string) => apiClient.delete(`/admin/groups/${groupId}/payment-account`);

// ── audit
export type AuditFilter = {
  search?: string;
  groupId?: string;
  action?: string;
  actorId?: string;
  entityType?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
};
export const auditPath = (groupId: string | null, f: AuditFilter = {}) =>
  `${groupId ? `/groups/${encodeURIComponent(groupId)}/audit-log` : "/admin/audit-logs"}${qs(f)}`;
export const fetchAudit = (groupId: string | null, f: AuditFilter) => get<Paged<AuditRow>>(auditPath(groupId, f));
export const fetchAuditActions = () => get<{ action: string; count: number }[]>("/admin/audit-logs/actions");

// ── platform
export const fetchPlatformSettings = () => get<PlatformSettings>("/admin/platform-settings");
export const savePlatformSettings = async (body: JsonObject) =>
  (await apiClient.put("/admin/platform-settings", body)) as unknown as PlatformSettings;
export const fetchPlatformMetrics = (months = 12) => get<PlatformMetrics>(`/admin/reports/platform?months=${months}`);

// ── read-only impersonation (support)
// The support token lives in memory only. Ending the session (or reloading the page) gets
// the super admin's own access token back from the refresh cookie.
export type ImpersonationInfo = { name: string; email: string; expiresAt: string };

let impersonation: ImpersonationInfo | null = null;
export const IMPERSONATION_EVENT = "lms:impersonation-changed";
const emit = () => typeof window !== "undefined" && window.dispatchEvent(new Event(IMPERSONATION_EVENT));

export function getImpersonation(): ImpersonationInfo | null {
  return impersonation;
}

export function beginImpersonation(r: ImpersonationResponse) {
  if (impersonation) return;
  impersonation = { name: r.user.fullName, email: r.user.email, expiresAt: r.expiresAt };
  tokenStorage.set(r.accessToken);
  emit();
}

/** Back to the super admin's own session. */
export async function endImpersonation() {
  impersonation = null;
  tokenStorage.remove();
  emit();
  await refreshSession();
}
