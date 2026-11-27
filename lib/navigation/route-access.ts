import type { Role } from "@/types/enum";

/**
 * Who may open which dashboard route (msfts §9). Longest matching prefix wins.
 * `[]` = any signed-in user. Super admins may open everything. The API enforces the real
 * rules; this keeps people from landing on screens that will only show errors.
 */
export const ROUTE_ROLES: readonly { prefix: string; roles: readonly Role[] }[] = [
  { prefix: "/dashboard", roles: [] },
  { prefix: "/dashboard/groups", roles: [] },
  { prefix: "/dashboard/loans", roles: ["MEMBER", "GROUP_ADMIN", "TREASURER"] },
  { prefix: "/dashboard/deposits", roles: ["MEMBER", "GROUP_ADMIN", "TREASURER"] },
  { prefix: "/dashboard/financial", roles: ["MEMBER", "GROUP_ADMIN", "TREASURER"] },
  { prefix: "/dashboard/loans-management", roles: ["GROUP_ADMIN", "TREASURER"] },
  { prefix: "/dashboard/manual-payments", roles: ["GROUP_ADMIN", "TREASURER"] },
  { prefix: "/dashboard/users", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/admin", roles: ["SUPER_ADMIN"] },
  { prefix: "/dashboard/settings", roles: [] },
  { prefix: "/dashboard/profile", roles: [] },
  { prefix: "/dashboard/help", roles: [] },
];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

/** Roles allowed on a path, or null when the path is not a dashboard route. */
export function rolesFor(pathname: string): readonly Role[] | null {
  let best: { prefix: string; roles: readonly Role[] } | null = null;
  for (const r of ROUTE_ROLES) {
    if (matches(pathname, r.prefix) && (!best || r.prefix.length > best.prefix.length)) best = r;
  }
  return best?.roles ?? null;
}

/** True when someone with these roles (platform role + group roles) may open the path. */
export function canAccess(pathname: string, roles: ReadonlySet<Role> | readonly Role[]): boolean {
  const have = roles instanceof Set ? roles : new Set(roles as readonly Role[]);
  if (have.has("SUPER_ADMIN")) return true;
  const need = rolesFor(pathname);
  if (need === null || need.length === 0) return true;
  return need.some((r) => have.has(r));
}

/** Non-sensitive hint cookies the proxy reads (the real session is the httpOnly refresh cookie). */
export const SESSION_HINT_COOKIE = "ek_session";
export const ROLES_HINT_COOKIE = "ek_roles";

export function encodeRoles(roles: Iterable<Role>): string {
  return [...new Set(roles)].sort().join(".");
}

export function decodeRoles(v: string | undefined | null): Role[] {
  if (!v) return [];
  const ok: Role[] = ["USER", "SUPER_ADMIN", "GROUP_ADMIN", "TREASURER", "MEMBER"];
  return v.split(".").filter((r): r is Role => (ok as string[]).includes(r));
}
