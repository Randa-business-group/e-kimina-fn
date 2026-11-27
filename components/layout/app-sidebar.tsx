"use client";

import { useT } from "@/lib/i18n/i18n-context";
import Link from "next/link";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/auth-context";
import { useClientMounted } from "@/lib/auth/use-client-mounted";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { navigationConfig } from "@/lib/navigation-config";
import { filterNavigationByAccess } from "@/lib/navigation/filter-navigation";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SidebarArt } from "@/components/layout/shell-art";
import { UserMenu } from "@/components/layout/user-menu";
import { cn } from "@/utils/cn";

const SIDEBAR_COLLAPSED_KEY = "ekimina-sidebar-collapsed";

type AppSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const { user } = useAuth();
  const tr = useT();
  const clientMounted = useClientMounted();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });

  /** Collapse only applies on large screens; drawer is always expanded on mobile. */
  const effectiveCollapsed =
    clientMounted && collapsed && isDesktop;

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  };

  const sections = user
    ? filterNavigationByAccess(navigationConfig, user)
    : [];

  const mobileDrawerInactive =
    clientMounted && !isDesktop && !mobileOpen;

  return (
    <aside
      className={cn(
        "flex h-full min-h-0 shrink-0 flex-col border-border bg-secondary isolate motion-safe:transition-[transform,width] motion-safe:duration-[var(--transition)] motion-safe:ease-out motion-reduce:transition-none",
        "fixed inset-y-0 left-0 z-40 max-h-dvh w-64 max-w-[min(16rem,calc(100vw-1.5rem))] max-lg:shadow-[var(--shadow-md)]",
        "border-r pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[max(0px,env(safe-area-inset-left,0px))]",
        mobileOpen ? "translate-x-0" : "-translate-x-full",
        "lg:relative lg:z-auto lg:max-h-none lg:translate-x-0 lg:pt-0 lg:pb-0 lg:pl-0 lg:shadow-none",
        effectiveCollapsed ? "lg:w-18" : "lg:w-64",
      )}
      aria-hidden={mobileDrawerInactive ? true : undefined}
      inert={mobileDrawerInactive ? true : undefined}
    >
      <div
        className={cn(
          "flex shrink-0 px-4 pt-4 pb-2",
          effectiveCollapsed
            ? "flex-col items-center gap-3 px-2"
            : "min-h-16 flex-row items-center gap-2 pl-6",
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex min-w-0 items-center gap-3 text-text",
            effectiveCollapsed ? "justify-center" : "flex-1",
          )}
          title="E-Kimina"
          onClick={() => onMobileClose()}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary font-display text-[22px] font-semibold text-primary-foreground">
            E
          </span>
          {!effectiveCollapsed ? (
            <span className="truncate font-display text-[26px] font-semibold lowercase leading-none tracking-[-0.01em]">e-kimina</span>
          ) : null}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="hidden shrink-0 rounded-md border border-border bg-card/60 text-text hover:bg-card lg:inline-flex"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </Button>
      </div>

      <nav className="sidebar-scrollbar flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden px-3 pt-4 pb-3">
        {sections.map((section) => (
          <div key={section.id}>
            {!effectiveCollapsed ? (
              <p className="mb-1.5 flex items-center gap-3 px-3 text-[11.5px] font-semibold uppercase tracking-[0.18em] text-text">
                {tr(`nav.section.${section.id}`) === `nav.section.${section.id}` ? section.label : tr(`nav.section.${section.id}`)}
                <span aria-hidden className="h-px flex-1 bg-border" />
              </p>
            ) : null}
            <SidebarNav
              items={section.items}
              collapsed={effectiveCollapsed}
              onNavigate={onMobileClose}
            />
          </div>
        ))}
      </nav>

      {!effectiveCollapsed ? (
        <SidebarArt className="-mb-2.5 shrink-0" />
      ) : null}
      <div className="relative mt-auto flex flex-col gap-1 rounded-t-[10px] border-t border-border bg-card p-3">
        <UserMenu collapsed={effectiveCollapsed} onNavigate={onMobileClose} />
      </div>
    </aside>
  );
}
