"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useT } from "@/lib/i18n/i18n-context";
import { collectEffectiveRoles } from "@/lib/navigation/filter-navigation";
import { canAccess, rolesFor } from "@/lib/navigation/route-access";

/** Shows a clear "no access" screen instead of a page that would only fail (msfts §9). */
export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useAuth();
  const t = useT();
  if (!user || canAccess(pathname, collectEffectiveRoles(user))) return <>{children}</>;
  const need = rolesFor(pathname) ?? [];
  const who = need.map((r) => t(`role.${r}`)).join(", ");
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md space-y-3 text-center">
        <ShieldAlert className="mx-auto size-10 text-text-muted" aria-hidden />
        <h1 className="text-xl font-semibold text-text">{t("access.deniedTitle")}</h1>
        <p className="text-sm text-text-muted">{t("access.deniedBody", { roles: who })}</p>
        <Link href="/dashboard" className="inline-block rounded-md bg-text px-4 py-2 text-sm font-semibold text-bg hover:opacity-90">
          {t("access.back")}
        </Link>
      </div>
    </div>
  );
}
