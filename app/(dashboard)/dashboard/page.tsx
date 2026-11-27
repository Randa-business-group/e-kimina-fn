"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Loader2, Users } from "lucide-react";
import { BarChart, ChartCard, StatTile, monthLabel, type Point } from "@/components/charts/charts";
import { useAuth } from "@/lib/auth/auth-context";
import { useI18n } from "@/lib/i18n/i18n-context";
import { toast } from "sonner";
import { useUserDashboardQuery } from "@/lib/query/reports-queries";

function greetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "home.morning";
  if (h < 17) return "home.afternoon";
  return "home.evening";
}

const roleLabel = (r: string) => (r === "GROUP_ADMIN" ? "Admin" : r === "TREASURER" ? "Treasurer" : "Member");

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-(--radius) border border-border bg-bg p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-text">{title}</h2>
        {action}
      </div>
      {children}
    </section>
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
    <div className="min-h-screen w-full bg-bg px-4 py-8 md:px-8">
      <div className="mx-auto flex max-w-350 flex-col gap-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-text-muted">{t(greetingKey())}</p>
            <h1 className="font-playfair text-3xl font-bold tracking-tight text-text md:text-4xl">
              {t("home.welcome")}{firstName ? ", " : ""}
              <span className="text-primary">{firstName}</span>
            </h1>
            <p className="mt-1 text-sm text-text-muted">{t("home.subtitle")}</p>
          </div>
          <div className="rounded-(--radius-sm) border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted">
            {new Date().toLocaleDateString(locale === "en" ? "en-GB" : `${locale}-RW`, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>

        {q.isLoading ? (
          <div className="flex items-center gap-2 py-16 text-sm text-text-muted">
            <Loader2 className="size-4 animate-spin" /> {t("shell.loading")}
          </div>
        ) : q.isError || !d ? (
          <p className="py-10 text-sm text-destructive">{q.error?.message ?? t("home.loadError")}</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatTile label={t("home.mySavings")} value={rwf(d.totals.savings)} note={t("home.acrossGroups", { count: d.totals.groups })} />
              <StatTile label={t("home.socialFund")} value={rwf(d.totals.socialFund)} />
              <StatTile
                label={t("home.loanOutstanding")}
                value={rwf(d.totals.loanOutstanding)}
                note={d.totals.openFines ? t("home.unpaidFines", { amount: rwf(d.totals.openFines) }) : undefined}
                tone={d.totals.openFines ? "warning" : undefined}
              />
              <StatTile
                label={t("home.dueSoon")}
                value={rwf(d.totals.dueNext30Days)}
                note={d.totals.overdue ? t("home.overdue", { amount: rwf(d.totals.overdue) }) : t("home.nothingOverdue")}
                tone={d.totals.overdue ? "critical" : undefined}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="flex flex-col gap-6 lg:col-span-2">
                <ChartCard
                  title={t("home.savingsPerMonth")}
                  description={t("home.totalSaved", { amount: rwf(d.totals.savings) })}
                  series={[{ key: "saved", label: t("home.savedThatMonth"), color: "var(--series-1)" }]}
                  data={savings}
                >
                  <BarChart series={{ key: "saved", label: t("home.savedThatMonth"), color: "var(--series-1)" }} data={savings} />
                </ChartCard>

                <Panel
                  title={t("home.recent")}
                  action={
                    <Link href="/dashboard/deposits" className="text-xs text-primary hover:underline">
                      {t("home.viewAll")}
                    </Link>
                  }
                >
                  {d.recent.length === 0 ? (
                    <p className="text-sm text-text-muted">{t("home.noTransactions")}</p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {d.recent.map((r) => (
                        <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-text-muted">
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

              <div className="flex flex-col gap-6">
                <Panel title={t("home.comingUp")}>
                  {d.upcoming.length === 0 ? (
                    <p className="text-sm text-text-muted">{t("home.nothingDue")}</p>
                  ) : (
                    <ul className="space-y-2.5">
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

                <Panel title={t("home.meetings")}>
                  {d.meetings.length === 0 ? (
                    <p className="text-sm text-text-muted">{t("home.noMeetings")}</p>
                  ) : (
                    <ul className="space-y-2.5">
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

            <Panel
              title={t("home.myGroups")}
              action={
                <Link href="/dashboard/groups" className="text-xs text-primary hover:underline">
                  {t("home.allGroups")}
                </Link>
              }
            >
              {d.groups.length === 0 ? (
                <p className="text-sm text-text-muted">
                  {t("home.noGroups")}{" "}
                  <Link href="/dashboard/groups" className="text-primary hover:underline">
                    {t("home.findGroup")}
                  </Link>
                  .
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {d.groups.map((g) => (
                    <Link
                      key={g.id}
                      href={`/dashboard/groups/${g.id}`}
                      className="rounded-(--radius) border border-border p-4 transition-colors hover:bg-secondary/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-text">{g.name}</p>
                        <span className="rounded-full border border-border px-2 py-0.5 text-xs text-text-muted">{roleLabel(g.role)}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
                        <Users className="size-3.5" /> {t("home.members", { count: g.memberCount })}{g.isVerified ? "" : ` · ${t("home.notVerified")}`}
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
