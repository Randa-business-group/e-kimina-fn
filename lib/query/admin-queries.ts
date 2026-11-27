import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  fetchAdminGroup,
  fetchAdminGroups,
  fetchAdminUser,
  fetchAdminUsers,
  fetchAudit,
  fetchAuditActions,
  fetchPlatformMetrics,
  fetchPlatformSettings,
  type AuditFilter,
  type GroupsFilter,
  type UsersFilter,
} from "@/lib/api/admin-api";

export const adminKeys = {
  all: ["admin"] as const,
  users: (f: UsersFilter) => ["admin", "users", f] as const,
  user: (id: string) => ["admin", "user", id] as const,
  groups: (f: GroupsFilter) => ["admin", "groups", f] as const,
  group: (id: string) => ["admin", "group", id] as const,
  audit: (groupId: string | null, f: AuditFilter) => ["admin", "audit", groupId ?? "", f] as const,
  actions: ["admin", "audit-actions"] as const,
  settings: ["admin", "platform-settings"] as const,
  metrics: (m: number) => ["admin", "platform-metrics", m] as const,
};

export const useAdminUsersQuery = (f: UsersFilter) =>
  useQuery({ queryKey: adminKeys.users(f), queryFn: () => fetchAdminUsers(f), placeholderData: keepPreviousData });

export const useAdminUserQuery = (id: string | null) =>
  useQuery({ queryKey: adminKeys.user(id ?? ""), queryFn: () => fetchAdminUser(id!), enabled: Boolean(id) });

export const useAdminGroupsQuery = (f: GroupsFilter) =>
  useQuery({ queryKey: adminKeys.groups(f), queryFn: () => fetchAdminGroups(f), placeholderData: keepPreviousData });

export const useAdminGroupQuery = (id: string | null) =>
  useQuery({ queryKey: adminKeys.group(id ?? ""), queryFn: () => fetchAdminGroup(id!), enabled: Boolean(id) });

export const useAuditQuery = (groupId: string | null, f: AuditFilter, enabled = true) =>
  useQuery({
    queryKey: adminKeys.audit(groupId, f),
    queryFn: () => fetchAudit(groupId, f),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useAuditActionsQuery = (enabled = true) =>
  useQuery({ queryKey: adminKeys.actions, queryFn: fetchAuditActions, enabled });

export const usePlatformSettingsQuery = () => useQuery({ queryKey: adminKeys.settings, queryFn: fetchPlatformSettings });

export const usePlatformMetricsQuery = (months = 12) =>
  useQuery({ queryKey: adminKeys.metrics(months), queryFn: () => fetchPlatformMetrics(months) });
