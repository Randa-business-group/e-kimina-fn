"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import {
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  CalendarDays,
  HandCoins,
  Layers,
  Loader2,
  Users,
  UsersRound,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BarChart, ChartCard, StatTile, monthLabel, type Point } from "@/components/charts/charts";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { toast } from "sonner";
import { useUserDashboardQuery } from "@/lib/query/reports-queries";
import { cn } from "@/utils/cn";

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.morning";
  if (h < 17) return "home.afternoon";
  return "home.evening";
}

const roleLabel = (r: string) => (r === "GROUP_ADMIN" ? "Admin" : r === "TREASURER" ? "Treasurer" : "Member");

/** Soft peach wave tucked into a card's bottom-right corner. */
function CornerWave() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 190 70"
      className="pointer-events-none absolute bottom-0 right-0 w-44 dark:opacity-15"
    >
      <path d="M0 70 C 60 62, 110 30, 190 0 V70 Z" fill="#f8e2d2" />
      <path d="M70 70 C 110 64, 150 44, 190 26 V70 Z" fill="#f4d3bc" />
    </svg>
  );
}

function Panel({
  title,
  icon: Icon,
  action,
  wave = false,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  action?: React.ReactNode;
  /** Decorative corner wave (used on the short side cards). */
  wave?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-(--radius) border border-border bg-card p-4 shadow-[0_1px_2px_rgba(91,48,20,0.04)] sm:p-4",
        wave && "pb-6 sm:pb-7",
        className,
      )}
    >
      {wave ? <CornerWave /> : null}
      <div className="relative flex items-start gap-3 sm:gap-4">
        <Icon aria-hidden className="mt-0.5 size-6 shrink-0 text-primary" strokeWidth={1.8} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 className="text-base font-semibold text-text sm:text-lg">{title}</h2>
            {action}
          </div>
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:text-base"
    >
      {children}
      <ArrowRight aria-hidden className="size-4 transition group-hover:translate-x-0.5 sm:size-5" />
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, money, date, dateTime, locale } = useI18n();
  const rwf = (n: number) => money(n);
  const fmtDate = (s: string, withTime = false) => (withTime ? dateTime(s) : date(s));
  useEffect(() => {
    if (window.location.search.includes("denied=1")) toast.error(t("access.deniedTitle"));
  }, [t]);
  const q = useUserDashboardQuery();
  const d = q.data;
  const firstName = (d?.user.fullName ?? user?.fullName ?? "").split(" ")[0];
  const savings: Point[] = useMemo(
    () => (d?.savingsSeries ?? []).map((s) => ({ x: monthLabel(s.month), values: { saved: s.saved, total: s.total } })),
    [d],
  );

  return (
    <div className="w-full pb-5 lg:pt-2">
      <div className="mx-auto flex max-w-350 flex-col gap-4 lg:gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-3 text-[15px] text-text sm:text-base">
              <span aria-hidden className="h-[3px] w-7 rounded-full bg-primary sm:w-8" />
              {t(greetingKey())}
            </p>
            <h1 className="mt-2 font-display text-[30px] font-semibold leading-tight tracking-[-0.01em] text-text md:text-[44px]">
              {t("home.welcome")}
              {firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="mt-1.5 text-[15px] text-text-muted sm:text-base">{t("home.subtitle")}</p>
          </div>
          <p className="flex h-11 items-center gap-3 rounded-(--radius) border border-border bg-card/70 px-4 text-[15px] font-medium text-text sm:h-12 sm:px-4 sm:text-base">
            <CalendarDays aria-hidden className="size-5 text-primary" />
            {new Date().toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-RW`, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {q.isLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-text-muted">
            <Loader2 className="size-4 animate-spin" /> {t("shell.loading")}
          </div>
        ) : q.isError || !d ? (
          <p className="py-8 text-sm text-destructive">{q.error?.message ?? t("home.loadError")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatTile
                icon={Wallet}
                label={t("home.mySavings")}
                value={rwf(d.totals.savings)}
                note={t("home.acrossGroups", { count: d.totals.groups })}
              />
              <StatTile icon={Layers} label={t("home.socialFund")} value={rwf(d.totals.socialFund)} />
              <StatTile
                icon={HandCoins}
                label={t("home.loanOutstanding")}
                value={rwf(d.totals.loanOutstanding)}
                note={d.totals.openFines ? t("home.unpaidFines", { amount: rwf(d.totals.openFines) }) : undefined}
                tone={d.totals.openFines ? "warning" : undefined}
              />
              <StatTile
                icon={CalendarClock}
                label={t("home.dueSoon")}
                value={rwf(d.totals.dueNext30Days)}
                note={d.totals.overdue ? t("home.overdue", { amount: rwf(d.totals.overdue) }) : t("home.nothingOverdue")}
                tone={d.totals.overdue ? "critical" : undefined}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
              <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-5">
                <ChartCard
                  title={t("home.savingsPerMonth")}
                  description={t("home.totalSaved", { amount: rwf(d.totals.savings) })}
                  series={[{ key: "saved", label: t("home.savedThatMonth"), color: "var(--series-1)" }]}
                  data={savings}
                >
                  <BarChart series={{ key: "saved", label: t("home.savedThatMonth"), color: "var(--series-1)" }} data={savings} />
                </ChartCard>

                <Panel title={t("home.recent")} icon={Zap} action={<ArrowLink href="/dashboard/deposits">{t("home.viewAll")}</ArrowLink>}>
                  {d.recent.length === 0 ? (
                    <p className="text-[15px] text-text-muted">{t("home.noTransactions")}</p>
                  ) : (
                    <ul className="mt-1 divide-y divide-border">
                      {d.recent.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                              {r.isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm text-text">{r.description}</p>
                              <p className="text-xs text-text-muted">
                                {r.groupName} · {fmtDate(r.date)}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-sm font-medium tabular-nums text-text">
                            {r.isCredit ? "+" : "−"}
                            {rwf(r.amount)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>

              <div className="flex flex-col gap-4 lg:gap-5">
                <Panel title={t("home.comingUp")} icon={CalendarDays} wave>
                  {d.upcoming.length === 0 ? (
                    <p className="text-[15px] text-text-muted">{t("home.nothingDue")}</p>
                  ) : (
                    <ul className="mt-1 space-y-2.5">
                      {d.upcoming.map((u) => {
                        const overdue = new Date(u.dueDate) < new Date();
                        return (
                          <li key={u.id} className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm text-text">{u.description}</p>
                              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                                {overdue ? (
                                  <span className="inline-block size-2 rounded-full" style={{ background: "var(--status-critical)" }} aria-hidden />
                                ) : null}
                                {overdue ? "Overdue · " : ""}
                                {u.groupName} · {fmtDate(u.dueDate)}
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-medium tabular-nums text-text">{rwf(u.amount)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Panel>

                <Panel title={t("home.meetings")} icon={Users} wave>
                  {d.meetings.length === 0 ? (
                    <p className="text-[15px] text-text-muted">{t("home.noMeetings")}</p>
                  ) : (
                    <ul className="mt-1 space-y-2.5">
                      {d.meetings.map((m) => (
                        <li key={m.id} className="flex items-start gap-3">
                          <CalendarDays className="mt-0.5 size-4 shrink-0 text-text-muted" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-text">{m.title}</p>
                            <p className="text-xs text-text-muted">
                              {m.groupName} · {fmtDate(m.scheduledAt, true)}
                              {m.location ? ` · ${m.location}` : ""}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              </div>
            </div>

            <Panel title={t("home.myGroups")} icon={UsersRound} action={<ArrowLink href="/dashboard/groups">{t("home.allGroups")}</ArrowLink>}>
              {d.groups.length === 0 ? (
                <p className="text-[15px] text-text-muted">
                  {t("home.noGroups")}{" "}
                  <Link href="/dashboard/groups" className="font-medium text-primary hover:underline">
                    {t("home.findGroup")}
                  </Link>
                  .
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {d.groups.map((g) => (
                    <Link
                      key={g.id}
                      href={`/dashboard/groups/${g.id}`}
                      className="rounded-(--radius) border border-border bg-background/60 p-4 transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-text">{g.name}</p>
                        <span className="rounded-sm bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">{roleLabel(g.role)}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <Users className="size-3.5" /> {t("home.members", { count: g.memberCount })}
                        {g.isVerified ? "" : ` · ${t("home.notVerified")}`}
                      </p>
                      <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                        <dt className="text-text-muted">{t("home.mySavings")}</dt>
                        <dd className="text-right tabular-nums text-text">{rwf(g.mySavings)}</dd>
                        <dt className="text-text-muted">{t("home.loan")}</dt>
                        <dd className="text-right tabular-nums text-text">{g.loanOutstanding ? rwf(g.loanOutstanding) : "—"}</dd>
                        <dt className="text-text-muted">{t("home.nextDue")}</dt>
                        <dd className="text-right tabular-nums text-text">
                          {g.nextDue ? `${rwf(g.nextDue.amount)} · ${fmtDate(g.nextDue.dueDate)}` : "—"}
                        </dd>
                      </dl>
                      {g.arrears || g.openFines ? (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                          <span className="inline-block size-2 rounded-full" style={{ background: "var(--status-critical)" }} aria-hidden />
                          {t("home.behind", { amount: rwf(g.arrears + g.openFines) })}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}
