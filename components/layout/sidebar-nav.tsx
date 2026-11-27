"use client";

import { useT } from "@/lib/i18n/i18n-context";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/types/navigation";
import { cn } from "@/utils/cn";

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SidebarNavProps = {
  items: readonly NavItem[];
  collapsed: boolean;
  depth?: number;
  /** e.g. close mobile drawer after navigation */
  onNavigate?: () => void;
};

export function SidebarNav({
  items,
  collapsed,
  depth = 0,
  onNavigate,
}: SidebarNavProps) {
  const pathname = usePathname();
  const tr = useT();
  const t = (key: string, fallback: string) => {
    const v = tr(key);
    return v === key ? fallback : v;
  };

  return (
    <ul
      className={cn(
        "flex flex-col gap-1",
        depth > 0 && "border-border ml-2 border-l pl-3",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isNavActive(pathname, item.href);
        const hasChildren = item.children !== undefined && item.children.length > 0;

        return (
          <li key={item.id}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={collapsed ? t(`nav.${item.id}`, item.label) : undefined}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex min-h-10 touch-manipulation items-center gap-3.5 rounded-md px-3 py-2 text-[15px] transition-[background,color] duration-200",
                active
                  ? "bg-primary font-medium text-primary-foreground shadow-[0_6px_14px_-8px_rgba(152,58,10,0.7)]"
                  : "text-text hover:bg-secondary-2",
                collapsed && "justify-center px-2",
              )}
            >
              <Icon
                className={cn("size-5 shrink-0", active ? "text-primary-foreground" : "text-text")}
                strokeWidth={1.7}
                aria-hidden
              />
              {!collapsed ? (
                <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <span className="truncate">{t(`nav.${item.id}`, item.label)}</span>
                  {item.badgeCount !== undefined && item.badgeCount > 0 ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold",
                        active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary text-primary-foreground",
                      )}
                    >
                      {item.badgeCount > 99 ? "99+" : String(item.badgeCount).padStart(2, "0")}
                    </span>
                  ) : null}
                </span>
              ) : null}
            </Link>
            {hasChildren && !collapsed ? (
              <SidebarNav
                items={item.children ?? []}
                collapsed={collapsed}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
