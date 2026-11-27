import { apiClient } from "@/lib/api/api-client";
import type { Announcement, Channel, NotificationPreferences, SmsLogPage } from "@/types/communication";
import { qs } from "@/lib/api/admin-api";

const as = <T,>(v: unknown) => v as T;

// ── preferences
export const fetchPreferences = async () => as<NotificationPreferences>(await apiClient.get("/users/me/notification-preferences"));
export const savePreferences = async (preferences: { category: string; channel: Channel; enabled: boolean }[]) =>
  as<NotificationPreferences>(await apiClient.put("/users/me/notification-preferences", { preferences }));
export const resetPreferences = async () => as<NotificationPreferences>(await apiClient.delete("/users/me/notification-preferences"));

// ── web push
export const fetchPushKey = async () => as<{ publicKey: string }>(await apiClient.get("/users/me/push/public-key"));
export const savePushSubscription = async (sub: PushSubscriptionJSON) =>
  as<{ devices: number }>(
    await apiClient.post("/users/me/push-subscriptions", {
      endpoint: sub.endpoint ?? "",
      keys: { p256dh: sub.keys?.p256dh ?? "", auth: sub.keys?.auth ?? "" },
    }),
  );
export const deletePushSubscription = (endpoint?: string) =>
  apiClient.delete("/users/me/push-subscriptions", endpoint ? { endpoint } : {});
export const sendTestPush = async () => as<{ sent: boolean }>(await apiClient.post("/users/me/push-subscriptions/test"));

// ── announcements
const ann = (groupId: string) => `/groups/${encodeURIComponent(groupId)}/announcements`;
export const fetchAnnouncements = async (groupId: string) => as<Announcement[]>(await apiClient.get(ann(groupId)));
export const createAnnouncement = async (groupId: string, body: { title: string; body: string; channels: Channel[]; pinned: boolean }) =>
  as<Announcement>(await apiClient.post(ann(groupId), body));
export const pinAnnouncement = async (groupId: string, id: string, pinned: boolean) =>
  as<Announcement>(await apiClient.patch(`${ann(groupId)}/${id}`, { pinned }));
export const deleteAnnouncement = (groupId: string, id: string) => apiClient.delete(`${ann(groupId)}/${id}`);

// ── super admin
export type SmsFilter = { status?: string; kind?: string; search?: string; page?: number; pageSize?: number };
export const fetchSmsLogs = async (f: SmsFilter) => as<SmsLogPage>(await apiClient.get(`/admin/sms-logs${qs(f)}`));

/** VAPID key (base64url) → bytes for PushManager.subscribe. */
export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
