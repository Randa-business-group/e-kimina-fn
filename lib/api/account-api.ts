import { apiClient, authFetch, tokenStorage } from "@/lib/api/api-client";
import { ApiError } from "@/lib/query/query-client";
import type { UserResponse } from "@/types/auth";

const as = <T,>(v: unknown) => v as T;

export type SecurityStatus = {
  twoFactor: { method: "TOTP" | "SMS" | null; enabledAt: string | null; recoveryCodesLeft: number; required: boolean };
  phone: { number: string | null; verified: boolean };
  passwordChangedAt: string | null;
};

export type DeviceSession = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  signedInAt: string;
  lastActiveAt: string;
  expiresAt: string;
  current: boolean;
};

export type DeletionState = {
  request: {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    reason: string | null;
    requestedAt: string;
    decidedAt: string | null;
    decisionNote: string | null;
  } | null;
  blockers: string[];
};

// ── profile
export const updateProfile = async (body: { fullName?: string; phoneNumber?: string | null; image?: string | null }) =>
  as<UserResponse>(await apiClient.patch("/users/me", body));
export const sendPhoneCode = async () => as<{ sent: boolean; message: string }>(await apiClient.post("/users/me/phone/send-code"));
export const verifyPhone = async (code: string) => as<UserResponse>(await apiClient.post("/users/me/phone/verify", { code }));

// ── password & sessions
export async function changePassword(currentPassword: string, newPassword: string) {
  const r = as<{ accessToken: string; user: UserResponse }>(
    await apiClient.post("/users/me/password", { currentPassword, newPassword }),
  );
  tokenStorage.set(r.accessToken);
  return r;
}
export const fetchSecurity = async () => as<SecurityStatus>(await apiClient.get("/users/me/security"));
export const fetchSessions = async () => as<DeviceSession[]>(await apiClient.get("/users/me/sessions"));
export const revokeSession = (id: string) => apiClient.delete(`/users/me/sessions/${encodeURIComponent(id)}`);

// ── two-step
export const startTotp = async () => as<{ secret: string; otpauthUrl: string }>(await apiClient.post("/users/me/2fa/totp/setup"));
export const enableTotp = async (code: string) =>
  as<{ method: "TOTP"; recoveryCodes: string[] }>(await apiClient.post("/users/me/2fa/totp/enable", { code }));
export const startSmsTwoFactor = async () => as<{ sent: boolean }>(await apiClient.post("/users/me/2fa/sms/start"));
export const confirmSmsTwoFactor = async (code: string) =>
  as<{ method: "SMS"; recoveryCodes: string[] }>(await apiClient.post("/users/me/2fa/sms/confirm", { code }));
export const disableTwoFactor = (password: string) => apiClient.post("/users/me/2fa/disable", { password });
export const newRecoveryCodes = async (password: string) =>
  as<{ recoveryCodes: string[] }>(await apiClient.post("/users/me/2fa/recovery-codes", { password }));

// ── privacy
export async function downloadMyData() {
  const res = await authFetch("/users/me/data-export");
  if (!res.ok) throw new ApiError(res.status, `Download failed (${res.status})`, null);
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "ekimina-my-data.json";
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
export const fetchDeletion = async () => as<DeletionState>(await apiClient.get("/users/me/deletion-request"));
export const requestDeletion = async (reason: string) =>
  as<DeletionState>(await apiClient.post("/users/me/deletion-request", reason ? { reason } : {}));
export const cancelDeletion = () => apiClient.delete("/users/me/deletion-request");

// ── super admin
export type AdminDeletionRow = NonNullable<DeletionState["request"]> & {
  userId: string;
  dueBy: string;
  blockers: string[];
  user: { id: string; fullName: string; email: string; phoneNumber: string | null };
};
export const fetchDeletionRequests = async (status?: string) =>
  as<AdminDeletionRow[]>(await apiClient.get(`/admin/deletion-requests${status ? `?status=${status}` : ""}`));
export const approveDeletion = (id: string, note?: string) =>
  apiClient.post(`/admin/deletion-requests/${id}/approve`, note ? { note } : {});
export const rejectDeletion = (id: string, note: string) => apiClient.post(`/admin/deletion-requests/${id}/reject`, { note });
