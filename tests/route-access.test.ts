import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { canAccess, decodeRoles, encodeRoles, rolesFor } from "@/lib/navigation/route-access";
import { navigationConfig } from "@/lib/navigation-config";
import { filterNavigationByAccess } from "@/lib/navigation/filter-navigation";
import type { UserResponse } from "@/types/auth";
import type { Role } from "@/types/enum";

const user = (platformRole: Role, groupRoles: Role[] = []): UserResponse => ({
  id: "u1",
  email: "a@b.c",
  fullName: "Aline Uwase",
  phoneNumber: null,
  image: null,
  emailVerified: true,
  platformRole,
  groupMemberships: groupRoles.map((role, i) => ({ groupId: `g${i}`, groupName: `G${i}`, role })),
  createdAt: "",
  updatedAt: "",
});

describe("route access", () => {
  it("uses the longest matching prefix", () => {
    assert.deepEqual(rolesFor("/dashboard/loans-management/x"), ["GROUP_ADMIN", "TREASURER"]);
    assert.deepEqual(rolesFor("/dashboard/loans"), ["MEMBER", "GROUP_ADMIN", "TREASURER"]);
    assert.deepEqual(rolesFor("/dashboard"), []);
    assert.equal(rolesFor("/login"), null);
  });

  it("lets members, leaders and super admins in where they belong", () => {
    assert.equal(canAccess("/dashboard/loans", ["USER", "MEMBER"]), true);
    assert.equal(canAccess("/dashboard/loans", ["USER"]), false);
    assert.equal(canAccess("/dashboard/manual-payments", ["USER", "MEMBER"]), false);
    assert.equal(canAccess("/dashboard/manual-payments", ["USER", "TREASURER"]), true);
    assert.equal(canAccess("/dashboard/admin/audit", ["USER", "GROUP_ADMIN"]), false);
    assert.equal(canAccess("/dashboard/admin/audit", ["SUPER_ADMIN"]), true);
    assert.equal(canAccess("/dashboard/settings", ["USER"]), true);
    assert.equal(canAccess("/dashboard/groups/abc", new Set<Role>(["USER"])), true);
  });

  it("does not confuse /dashboard/loans with /dashboard/loans-management", () => {
    assert.equal(canAccess("/dashboard/loans-management", ["MEMBER"]), false);
  });

  it("round-trips the roles hint cookie and ignores junk", () => {
    assert.equal(encodeRoles(["TREASURER", "USER", "TREASURER"]), "TREASURER.USER");
    assert.deepEqual(decodeRoles("TREASURER.USER.HACKER"), ["TREASURER", "USER"]);
    assert.deepEqual(decodeRoles(undefined), []);
  });
});

describe("navigation agrees with route access", () => {
  const people: [string, UserResponse][] = [
    ["new user", user("USER")],
    ["member", user("USER", ["MEMBER"])],
    ["treasurer", user("USER", ["TREASURER"])],
    ["group admin", user("USER", ["GROUP_ADMIN", "MEMBER"])],
    ["super admin", user("SUPER_ADMIN")],
  ];
  for (const [who, u] of people) {
    it(`never shows a ${who} a link they cannot open`, () => {
      const roles = new Set<Role>([u.platformRole, ...u.groupMemberships.map((m) => m.role)]);
      for (const section of filterNavigationByAccess(navigationConfig, u)) {
        for (const item of section.items) assert.equal(canAccess(item.href, roles), true, `${who} → ${item.href}`);
      }
    });
  }

  it("shows super admins the admin pages", () => {
    const hrefs = filterNavigationByAccess(navigationConfig, user("SUPER_ADMIN")).flatMap((s) => s.items.map((i) => i.href));
    for (const h of ["/dashboard/users", "/dashboard/admin/audit", "/dashboard/admin/platform"]) assert.ok(hrefs.includes(h), h);
  });
});
