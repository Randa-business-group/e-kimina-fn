"use client";

import { useMemo, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, ChartCard, LineChart, StatTile, monthLabel, rwf, type Point } from "@/components/charts/charts";
import { downloadReport, reportPaths, type ReportRange } from "@/lib/api/reports-api";
import { getApiErrorMessage } from "@/lib/api/error-utils";
import { useGroupQuery, useGroupsQuery } from "@/lib/query/groups-queries";
import {
  useArrearsQuery,
  useCashBookQuery,
  useCyclesQuery,
  useGroupDashboardQuery,
  useMatrixQuery,
  usePortfolioQuery,
  useShareOutQuery,
  useStatementQuery,
} from "@/lib/query/reports-queries";
import { ROLE } from "@/types/enum";
import { AuditLog } from "@/components/admin/audit-log";

const day = (s: string | null | undefined) => (s ? new Date(s).toISOString().slice(0, 10) : "—");

function Downloads({ path, pdf = true, csv = true }: { path: string; pdf?: boolean; csv?: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const go = async (format: "csv" | "pdf") => {
    setBusy(format);
    try {
      await downloadReport(path, format);
    } catch (e) {
      toast.error(e instanceof Error ? getApiErrorMessage(e) : "Download failed");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex gap-2">
      {csv ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void go("csv")} disabled={busy != null}>
          {busy === "csv" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} CSV
        </Button>
      ) : null}
      {pdf ? (
        <Button type="button" variant="outline" size="sm" onClick={() => void go("pdf")} disabled={busy != null}>
          {busy === "pdf" ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />} PDF
        </Button>
      ) : null}
    </div>
  );
}

function Loading({ q }: { q: { isLoading: boolean; isError: boolean; error: Error | null } }) {
  if (q.isLoading)
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </div>
    );
  if (q.isError) return <p className="py-5 text-sm text-destructive">{q.error?.message ?? "Could not load the report."}</p>;
  return null;
}

function Header({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      {children}
    </div>
  );
}

function Table({ head, rows, right = [] }: { head: string[]; rows: React.ReactNode[][]; right?: number[] }) {
  return (
    <div className="overflow-auto rounded-(--radius) border border-border">
      <table className="w-full min-w-150 text-sm">
        <thead className="bg-secondary/60">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`px-3 py-2 text-xs font-medium text-text-muted ${right.includes(i) ? "text-right" : "text-left"}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={head.length} className="px-3 py-5 text-center text-text-muted">
                Nothing to show for this period.
              </td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className="border-t border-border">
                {r.map((c, j) => (
                  <td key={j} className={`px-3 py-2 text-text ${right.includes(j) ? "text-right tabular-nums" : ""}`}>
                    {c}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ── tabs ────────────────────────────────────────────────────────────────

function OverviewTab({ groupId }: { groupId: string }) {
  const q = useGroupDashboardQuery(groupId);
  const d = q.data;
  const points: Point[] = useMemo(
    () =>
      (d?.series ?? []).map((s) => ({
        x: monthLabel(s.month),
        values: { cash: s.cashBalance, loans: s.loansOutstanding, savings: s.savingsIn, income: s.income },
      })),
    [d],
  );
  if (!d) return <Loading q={q} />;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Cash in the group" value={rwf(d.kpis.cash)} note={`${rwf(d.kpis.availableForLoans)} free for loans`} />
        <StatTile label="Loans outstanding" value={rwf(d.kpis.loansOutstanding)} />
        <StatTile label="Social fund" value={rwf(d.kpis.socialFund)} />
        <StatTile label="My savings" value={rwf(d.kpis.mySavings)} note={`${d.kpis.members} active members`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Cash vs money lent out"
          description="End-of-month balance of the savings fund and principal still out on loan"
          series={[
            { key: "cash", label: "Cash in the group", color: "var(--series-1)" },
            { key: "loans", label: "Loans outstanding", color: "var(--series-2)" },
          ]}
          data={points}
        >
          <LineChart
            series={[
              { key: "cash", label: "Cash in the group", color: "var(--series-1)" },
              { key: "loans", label: "Loans outstanding", color: "var(--series-2)" },
            ]}
            data={points}
          />
        </ChartCard>
        <ChartCard
          title="Savings collected per month"
          series={[{ key: "savings", label: "Savings collected", color: "var(--series-1)" }]}
          data={points}
        >
          <BarChart series={{ key: "savings", label: "Savings collected", color: "var(--series-1)" }} data={points} />
        </ChartCard>
        <ChartCard
          title="Group income per month"
          description="Interest, loan penalties and fines"
          series={[{ key: "income", label: "Income", color: "var(--series-3)" }]}
          data={points}
          className="lg:col-span-2"
        >
          <BarChart series={{ key: "income", label: "Income", color: "var(--series-3)" }} data={points} />
        </ChartCard>
      </div>
    </div>
  );
}

function StatementTab({ groupId, range }: { groupId: string; range: ReportRange }) {
  const q = useStatementQuery(groupId, range);
  const d = q.data;
  return (
    <div>
      <Header title="My statement">
        <Downloads path={reportPaths.statement(groupId, "me", range)} />
      </Header>
      {!d ? (
        <Loading q={q} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Savings (closing)" value={rwf(d.summary.closingSavings)} note={`+${rwf(d.summary.savingsInPeriod)} in this period`} />
            <StatTile label="Social fund (period)" value={rwf(d.summary.socialFundInPeriod)} />
            <StatTile
              label="Loan outstanding"
              value={rwf(d.summary.loanOutstanding)}
              note={d.summary.loanRepaidInPeriod ? `${rwf(d.summary.loanRepaidInPeriod)} repaid in period` : undefined}
            />
            <StatTile
              label="Open fines"
              value={rwf(d.summary.openFines)}
              note={d.summary.lateContributions ? `${d.summary.lateContributions} late contributions` : undefined}
              tone={d.summary.lateContributions ? "critical" : undefined}
            />
          </div>
          <Table
            head={["Date", "Type", "Fund", "In", "Out"]}
            right={[3, 4]}
            rows={[...d.lines].reverse().map((l) => [
              day(l.date),
              l.label,
              l.fund === "SOCIAL" ? "Social" : "Savings",
              l.direction === "IN" ? rwf(l.amount) : "",
              l.direction === "OUT" ? rwf(l.amount) : "",
            ])}
          />
        </div>
      )}
    </div>
  );
}

const CELL: Record<string, { glyph: string; color: string; label: string }> = {
  PAID: { glyph: "✓", color: "var(--series-3)", label: "Paid" },
  LATE: { glyph: "!", color: "var(--status-critical)", label: "Late" },
  PARTIALLY_PAID: { glyph: "½", color: "var(--status-warning)", label: "Partly paid" },
  PENDING: { glyph: "·", color: "var(--chart-axis)", label: "Pending" },
  CANCELLED: { glyph: "×", color: "var(--chart-axis)", label: "Cancelled" },
};

export function MatrixTab({ groupId, range }: { groupId: string; range: ReportRange }) {
  const [fund, setFund] = useState("SAVINGS");
  const q = useMatrixQuery(groupId, { ...range, fund });
  const d = q.data;
  return (
    <div>
      <Header title="Contributions">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fund} onValueChange={setFund}>
            <SelectTrigger className="h-9 w-36 border-border bg-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAVINGS">Savings</SelectItem>
              <SelectItem value="SOCIAL">Social fund</SelectItem>
            </SelectContent>
          </Select>
          <Downloads path={reportPaths.matrix(groupId, { ...range, fund })} />
        </div>
      </Header>
      {!d ? (
        <Loading q={q} />
      ) : (
        <>
          <p className="mb-2 text-sm text-text-muted">
            Collected {rwf(d.totals.collected)} of {rwf(d.totals.expected)} expected ·{" "}
            {Object.values(CELL).map((c) => (
              <span key={c.label} className="mr-3 inline-flex items-center gap-1">
                <span style={{ color: c.color }} className="font-bold">
                  {c.glyph}
                </span>
                {c.label}
              </span>
            ))}
          </p>
          <div className="overflow-auto rounded-(--radius) border border-border">
            <table className="text-xs">
              <thead className="bg-secondary/60">
                <tr>
                  <th className="sticky left-0 bg-bg px-3 py-2 text-left font-medium text-text-muted">Member</th>
                  {d.periods.map((p) => (
                    <th key={p} className="px-1 py-2 font-medium text-text-muted" title={day(p)}>
                      {day(p).slice(5)}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-medium text-text-muted">Paid</th>
                  <th className="px-3 py-2 text-right font-medium text-text-muted">Late</th>
                </tr>
              </thead>
              <tbody>
                {d.members.map((m) => (
                  <tr key={m.userId} className="border-t border-border">
                    <td className="sticky left-0 whitespace-nowrap bg-bg px-3 py-1.5 text-text">{m.name}</td>
                    {m.cells.map((c, i) => {
                      const s = c ? CELL[c.status] : null;
                      return (
                        <td
                          key={i}
                          className="px-1 py-1.5 text-center font-bold"
                          style={{ color: s?.color }}
                          title={c ? `${day(d.periods[i])}: ${s?.label} (${rwf(c.amountPaid)} / ${rwf(c.amount)})` : "Not a member yet"}
                        >
                          {s?.glyph ?? ""}
                        </td>
                      );
                    })}
                    <td className="px-3 py-1.5 text-right tabular-nums text-text">{m.paid}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text">{m.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ArrearsTab({ groupId }: { groupId: string }) {
  const q = useArrearsQuery(groupId);
  const d = q.data;
  return (
    <div>
      <Header title="Arrears & defaulters">
        <Downloads path={reportPaths.arrears(groupId)} />
      </Header>
      {!d ? (
        <Loading q={q} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Members in arrears" value={String(d.totals.members)} note={`${d.totals.defaulters} defaulted`} tone={d.totals.defaulters ? "critical" : undefined} />
            <StatTile label="Late contributions" value={rwf(d.totals.lateAmount)} />
            <StatTile label="Unpaid fines" value={rwf(d.totals.openFines)} />
            <StatTile label="Overdue loans" value={rwf(d.totals.overdueLoanAmount)} />
          </div>
          <Table
            head={["Member", "Phone", "Late periods", "Fines", "Overdue loan", "Days late", "Total", ""]}
            right={[2, 3, 4, 5, 6]}
            rows={d.members.map((m) => [
              m.name,
              m.phone ?? "—",
              m.lateContributions ? `${m.lateContributions} · ${rwf(m.lateAmount)}` : "—",
              m.openFines ? rwf(m.openFines) : "—",
              m.overdueLoanAmount ? rwf(m.overdueLoanAmount) : "—",
              m.daysOverdue || "—",
              rwf(m.total),
              m.defaulted ? (
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  <span className="inline-block size-2 rounded-full" style={{ background: "var(--status-critical)" }} /> Defaulted
                </span>
              ) : (
                ""
              ),
            ])}
          />
        </div>
      )}
    </div>
  );
}

export function LoansTab({ groupId, range }: { groupId: string; range: ReportRange }) {
  const q = usePortfolioQuery(groupId, range);
  const d = q.data;
  const buckets: Point[] = useMemo(() => (d?.buckets ?? []).map((b) => ({ x: b.bucket === "CURRENT" ? "Current" : `${b.bucket} d`, values: { amt: b.principalOutstanding } })), [d]);
  return (
    <div>
      <Header title="Loan portfolio">
        <Downloads path={reportPaths.portfolio(groupId, range)} />
      </Header>
      {!d ? (
        <Loading q={q} />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatTile label="Principal outstanding" value={rwf(d.portfolio.principalOutstanding)} note={`${d.counts.active + d.counts.defaulted} open loans`} />
            <StatTile label="PAR 30" value={`${d.portfolio.par30.percent}%`} note={rwf(d.portfolio.par30.amount)} tone={d.portfolio.par30.percent > 10 ? "critical" : d.portfolio.par30.percent > 5 ? "warning" : undefined} />
            <StatTile label="PAR 90" value={`${d.portfolio.par90.percent}%`} note={rwf(d.portfolio.par90.amount)} />
            <StatTile label="Interest earned (period)" value={rwf(d.periodFlows.interestEarned)} note={`+${rwf(d.periodFlows.penaltiesEarned)} penalties`} />
          </div>
          <ChartCard title="Ageing of principal outstanding" description="Days since the oldest unpaid installment fell due" series={[{ key: "amt", label: "Principal outstanding", color: "var(--series-2)" }]} data={buckets}>
            <BarChart series={{ key: "amt", label: "Principal outstanding", color: "var(--series-2)" }} data={buckets} />
          </ChartCard>
          <Table
            head={["Borrower", "Disbursed", "Due", "Principal", "Left", "Total due", "Days late", "Status"]}
            right={[3, 4, 5, 6]}
            rows={d.loans.map((l) => [l.borrower, day(l.disbursedAt), day(l.dueDate), rwf(l.principal), rwf(l.principalOutstanding), rwf(l.outstanding), l.daysOverdue || "—", l.status.toLowerCase()])}
          />
        </div>
      )}
    </div>
  );
}

export function CashBookTab({ groupId, range }: { groupId: string; range: ReportRange }) {
  const [fund, setFund] = useState("SAVINGS");
  const q = useCashBookQuery(groupId, { ...range, fund });
  const d = q.data;
  return (
    <div>
      <Header title="Cash book">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fund} onValueChange={setFund}>
            <SelectTrigger className="h-9 w-36 border-border bg-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SAVINGS">Savings fund</SelectItem>
              <SelectItem value="SOCIAL">Social fund</SelectItem>
              <SelectItem value="ALL">Both funds</SelectItem>
            </SelectContent>
          </Select>
          <Downloads path={reportPaths.cashBook(groupId, { ...range, fund })} />
        </div>
      </Header>
      {!d ? (
        <Loading q={q} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            Opening <span className="font-medium text-text">{rwf(d.openingBalance)}</span> + in {rwf(d.totalIn)} − out {rwf(d.totalOut)} = closing{" "}
            <span className="font-medium text-text">{rwf(d.closingBalance)}</span>
          </p>
          <Table
            head={["Date", "Type", "Member", "In", "Out", "Balance"]}
            right={[3, 4, 5]}
            rows={[...d.lines].reverse().slice(0, 300).map((l) => [day(l.date), l.label, l.member ?? "—", l.in ? rwf(l.in) : "", l.out ? rwf(l.out) : "", rwf(l.balance)])}
          />
          {d.lines.length > 300 ? <p className="text-xs text-text-muted">Showing the latest 300 lines — download the CSV for everything.</p> : null}
        </div>
      )}
    </div>
  );
}

function ShareOutTab({ groupId }: { groupId: string }) {
  const cycles = useCyclesQuery(groupId);
  const [cycleId, setCycleId] = useState("");
  const selected = cycleId || cycles.data?.[0]?.id || "";
  const q = useShareOutQuery(groupId, selected);
  const d = q.data;
  return (
    <div>
      <Header title="Cycle share-out">
        <div className="flex flex-wrap items-center gap-2">
          {cycles.data?.length ? (
            <Select value={selected} onValueChange={setCycleId}>
              <SelectTrigger className="h-9 w-44 border-border bg-bg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {cycles.data.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.status.toLowerCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}
          {selected ? <Downloads path={reportPaths.shareOut(groupId, selected)} /> : null}
        </div>
      </Header>
      {cycles.data && cycles.data.length === 0 ? (
        <p className="text-sm text-text-muted">This group has no savings cycle yet.</p>
      ) : !d ? (
        <Loading q={q.isLoading || cycles.isLoading ? { ...q, isLoading: true } : q} />
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-text-muted">
            {d.final ? "Final share-out" : "Preview — the cycle is still open, figures change until it closes"} · net profit{" "}
            <span className="font-medium text-text">{rwf(d.totals?.netProfit ?? 0)}</span> · payout{" "}
            <span className="font-medium text-text">{rwf(d.totals?.netPayout ?? 0)}</span>
          </p>
          <Table
            head={["Member", "Savings", "Profit share", "Gross", "Debts", "Net payout", "Status"]}
            right={[1, 2, 3, 4, 5]}
            rows={d.lines.map((l) => [
              l.fullName,
              rwf(l.savings + l.openingBalance),
              rwf(l.profitShare),
              rwf(l.grossAmount),
              l.fineDeduction + l.loanDeduction ? rwf(l.fineDeduction + l.loanDeduction) : "—",
              rwf(l.netPayout),
              (l.status ?? (d.final ? "" : "preview")).toLowerCase(),
            ])}
          />
        </div>
      )}
    </div>
  );
}

// ── page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const groups = useGroupsQuery("mine");
  const [picked, setGroupId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const groupId = picked || groups.data?.find((g) => g.isVerified)?.id || groups.data?.[0]?.id || "";
  const group = useGroupQuery(groupId, Boolean(groupId));
  const isLeader = group.data?.myRole === ROLE.GROUP_ADMIN || group.data?.myRole === ROLE.TREASURER;
  const range: ReportRange = { from: from || undefined, to: to || undefined };

  return (
    <main className="pb-5 lg:pt-2">
      <div className="container mx-auto max-w-6xl space-y-4 px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[34px]">Reports</h1>
            <p className="mt-1 text-sm text-text-muted">Statements, contributions, loans and cash, with CSV and PDF downloads.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-text-muted">Group</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger className="h-9 w-56 border-border bg-bg">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {(groups.data ?? []).map((g) => (
                    <SelectItem key={g.id} value={g.id} disabled={!g.isVerified}>
                      {g.name}
                      {g.isVerified ? "" : " (not verified)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="r-from" className="text-xs text-text-muted">From</Label>
              <Input id="r-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40 border-border bg-bg" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="r-to" className="text-xs text-text-muted">To</Label>
              <Input id="r-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 w-40 border-border bg-bg" />
            </div>
          </div>
        </div>
        {groups.isLoading ? (
          <Loading q={groups} />
        ) : !groupId ? (
          <p className="text-sm text-text-muted">Join a group to see its reports.</p>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="flex-wrap">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="statement">My statement</TabsTrigger>
              {isLeader ? <TabsTrigger value="matrix">Contributions</TabsTrigger> : null}
              {isLeader ? <TabsTrigger value="arrears">Arrears</TabsTrigger> : null}
              {isLeader ? <TabsTrigger value="loans">Loans</TabsTrigger> : null}
              {isLeader ? <TabsTrigger value="cash">Cash book</TabsTrigger> : null}
              <TabsTrigger value="shareout">Share-out</TabsTrigger>
              {isLeader ? <TabsTrigger value="activity">Activity log</TabsTrigger> : null}
            </TabsList>
            <p className="mt-2 text-xs text-text-muted">
              Period: {from || "start of the current cycle"} → {to || "today"}
            </p>
            <div className="mt-4">
              <TabsContent value="overview"><OverviewTab groupId={groupId} /></TabsContent>
              <TabsContent value="statement"><StatementTab groupId={groupId} range={range} /></TabsContent>
              {isLeader ? <TabsContent value="matrix"><MatrixTab groupId={groupId} range={range} /></TabsContent> : null}
              {isLeader ? <TabsContent value="arrears"><ArrearsTab groupId={groupId} /></TabsContent> : null}
              {isLeader ? <TabsContent value="loans"><LoansTab groupId={groupId} range={range} /></TabsContent> : null}
              {isLeader ? <TabsContent value="cash"><CashBookTab groupId={groupId} range={range} /></TabsContent> : null}
              <TabsContent value="shareout"><ShareOutTab groupId={groupId} /></TabsContent>
              {isLeader ? <TabsContent value="activity"><AuditLog groupId={groupId} /></TabsContent> : null}
            </div>
          </Tabs>
        )}
      </div>
    </main>
  );
}
