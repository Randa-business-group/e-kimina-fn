"use client";

import { ChevronDown, Globe, Menu, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/i18n-context";
import { LOCALES, LOCALE_NAMES } from "@/lib/i18n/dictionaries";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { useTheme } from "@/lib/providers/theme-provider";
import { cn } from "@/utils/cn";

type DashboardTopBarProps = {
  onOpenMobileNav: () => void;
};

export function DashboardTopBar({ onOpenMobileNav }: DashboardTopBarProps) {
  const { theme, toggleTheme, mounted } = useTheme();
  const { t, locale, setLocale } = useI18n();

  return (
    <header
      className={cn(
        "relative z-20 flex min-h-16 shrink-0 items-center gap-2.5 border-b border-border bg-secondary sm:gap-3",
        "px-3 pt-[max(0px,env(safe-area-inset-top,0px))] pb-0 sm:px-4",
        "lg:border-b-0 lg:bg-transparent lg:pt-0 lg:pl-6 lg:pr-6",
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-10 shrink-0 rounded-md border border-border bg-card/60 text-text hover:bg-card lg:hidden"
        onClick={onOpenMobileNav}
        aria-label={t("shell.openMenu")}
      >
        <Menu className="size-5" />
      </Button>
      <span className="mr-auto min-w-0 truncate text-xs font-semibold uppercase tracking-[0.24em] text-text sm:text-[13px]">
        {t("shell.workspace")}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 shrink-0 gap-1.5 rounded-md border border-border bg-card/60 px-3 text-text hover:bg-card"
            aria-label={t("shell.language")}
          >
            <Globe className="size-4.5" />
            <span className="text-sm font-semibold uppercase">{locale}</span>
            <ChevronDown className="size-4 text-text-muted" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {LOCALES.map((l) => (
            <DropdownMenuItem key={l} onSelect={() => setLocale(l)} className={l === locale ? "font-semibold" : undefined}>
              {LOCALE_NAMES[l]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <NotificationBell />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "h-10 shrink-0 rounded-md border border-border bg-card/60 text-text hover:bg-card",
          "gap-2 px-3 text-sm font-medium",
        )}
        onClick={() => toggleTheme()}
        aria-label={
          mounted && theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
        }
      >
        {mounted && theme === "dark" ? (
          <>
            <Sun className="size-4.5 shrink-0 text-primary" />
            <span className="hidden sm:inline">{t("shell.light")}</span>
          </>
        ) : (
          <>
            <Moon className="size-4.5 shrink-0 text-primary" />
            <span className="hidden sm:inline">{t("shell.dark")}</span>
          </>
        )}
      </Button>
    </header>
  );
}
