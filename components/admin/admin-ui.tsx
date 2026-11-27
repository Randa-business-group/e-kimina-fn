"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

export const fmtDateTime = (s: string | null | undefined) =>
  s
    ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const money = (n: number, cur = "RWF") => `${Math.round(n).toLocaleString("en-US")} ${cur}`;

type Tone = "good" | "warning" | "critical" | "neutral" | "info";
const TONE: Record<Tone, string> = {
  good: "var(--series-3)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  info: "var(--series-1)",
  neutral: "var(--chart-axis)",
};

/** Status label with a colored dot (never color alone). */
export function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-xs text-text">
      <span className="inline-block size-2 rounded-full" style={{ background: TONE[tone] }} aria-hidden />
      {children}
    </span>
  );
}

export const USER_STATUS: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Active", tone: "good" },
  SUSPENDED: { label: "Suspended", tone: "critical" },
  LOCKED: { label: "Locked", tone: "warning" },
  UNVERIFIED: { label: "Email not verified", tone: "neutral" },
  PENDING_INVITE: { label: "Invited", tone: "info" },
};

export const VERIFICATION: Record<string, { label: string; tone: Tone }> = {
  VERIFIED: { label: "Verified", tone: "good" },
  PENDING: { label: "Awaiting review", tone: "warning" },
  REJECTED: { label: "Rejected", tone: "critical" },
  UNVERIFIED: { label: "Not verified", tone: "neutral" },
};

export function PageShell({ title, description, actions, children }: { title: string; description: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <main className="min-h-screen bg-bg-muted/30 py-6">
      <div className="container mx-auto max-w-6xl space-y-5 px-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          </div>
          {actions}
        </div>
        {children}
      </div>
    </main>
  );
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full md:w-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-9 border-border bg-bg pl-8" />
    </div>
  );
}

export function FilterChips<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; count?: number }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            value === o.value ? "border-primary bg-primary/10 text-text" : "border-border text-text-muted hover:text-text",
          )}
        >
          {o.label}
          {o.count != null ? <span className="ml-1 tabular-nums text-text-muted">{o.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, totalPages, total, onPage, busy }: { page: number; totalPages: number; total: number; onPage: (p: number) => void; busy?: boolean }) {
  if (totalPages <= 1) return <p className="text-xs text-text-muted">{total} result{total === 1 ? "" : "s"}</p>;
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs text-text-muted">
        Page {page} of {totalPages} · {total} results {busy ? <Loader2 className="ml-1 inline size-3 animate-spin" /> : null}
      </p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-text-muted">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}

export function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("space-y-2", className)}>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</h3>
      {children}
    </section>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-text-muted">{k}</dt>
          <dd className="min-w-0 break-words text-text">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
