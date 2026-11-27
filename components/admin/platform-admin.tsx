"use client";

import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BarChart, ChartCard, LineChart, StatTile, monthLabel, rwf, type Point } from "@/components/charts/charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { downloadReport } from "@/lib/api/reports-api";
import { savePlatformSettings } from "@/lib/api/admin-api";
import { adminKeys, usePlatformMetricsQuery, usePlatformSettingsQuery } from "@/lib/query/admin-queries";
import type { PlatformSettings } from "@/types/admin";
import { Loading, PageShell, Section, fmtDateTime } from "./admin-ui";
import { SmsLog } from "./sms-log";
import { JobsPanel } from "./jobs-panel";

const count = (n: number) => Math.round(n).toLocaleString("en-US");

function Overview() {
  const q = usePlatformMetricsQuery(12);
  const d = q.data;
  const points: Point[] = useMemo(
    () =>
      (d?.series ?? []).map((s) => ({
        x: monthLabel(s.month),
        values: { volume: s.depositVolume, users: s.newUsers, groups: s.newGroups, loans: s.loansDisbursed },
      })),
    [d],
  );
  if (q.isLoading) return <Loading />;
  if (q.isError || !d) return <p className="text-sm text-destructive">{q.error?.message ?? "Could not load metrics."}</p>;
  const growth = [
    { key: "users", label: "New users", color: "var(--series-1)" },
    { key: "groups", label: "New groups", color: "var(--series-2)" },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Live groups"
          value={count(d.groups.live)}
          note={`${d.groups.verified} verified · ${d.groups.pendingVerification} awaiting review`}
          tone={d.groups.pendingVerification ? "warning" : undefined}
        />
        <StatTile
          label="Users"
          value={count(d.users.total)}
          note={`${d.users.activeMemberships} active memberships${d.users.suspended ? ` · ${d.users.suspended} suspended` : ""}`}
        />
        <StatTile label="Money deposited (all time)" value={rwf(d.money.depositVolumeAllTime)} note={`${count(d.money.depositCountAllTime)} deposits`} />
        <StatTile
          label="Loans outstanding"
          value={rwf(d.money.loansOutstanding)}
          note={`${d.money.openLoans} open · ${d.money.par30Percent}% overdue 30+ days`}
          tone={d.money.par30Percent > 10 ? "critical" : d.money.par30Percent > 5 ? "warning" : undefined}
        />
      </div>
      {d.money.platformFeesCollected ? (
        <p className="text-sm text-text-muted">
          Platform fees collected: <span className="font-medium text-text">{rwf(d.money.platformFeesCollected)}</span>
        </p>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Money deposited per month" series={[{ key: "volume", label: "Deposits", color: "var(--series-1)" }]} data={points}>
          <BarChart series={{ key: "volume", label: "Deposits", color: "var(--series-1)" }} data={points} />
        </ChartCard>
        <ChartCard title="Growth" description="New accounts and groups per month" series={growth} data={points} tooltipFmt={count}>
          <LineChart series={growth} data={points} tooltipFmt={count} />
        </ChartCard>
      </div>
      <section className="rounded-(--radius) border border-border bg-bg p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text">Most active groups</h3>
          <Button variant="outline" size="sm" onClick={() => void downloadReport("/admin/reports/platform", "csv").catch((e: Error) => toast.error(e.message))}>
            CSV
          </Button>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-text-muted">
            <tr>
              <th className="py-1 font-medium">Group</th>
              <th className="py-1 text-right font-medium">Deposits</th>
              <th className="py-1 text-right font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {d.topGroups.map((g) => (
              <tr key={g.id} className="border-t border-border">
                <td className="py-1.5 text-text">{g.name}</td>
                <td className="py-1.5 text-right tabular-nums text-text">{count(g.deposits)}</td>
                <td className="py-1.5 text-right tabular-nums text-text">{rwf(g.volume)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SettingsForm({ s }: { s: PlatformSettings }) {
  const qc = useQueryClient();
  const [currencies, setCurrencies] = useState(s.supportedCurrencies.join(", "));
  const [defaultCurrency, setDefaultCurrency] = useState(s.defaultCurrency);
  const [collectionMode, setCollectionMode] = useState(s.collectionMode);
  const [accountName, setAccountName] = useState(s.platformAccountName ?? "");
  const [accountMsisdn, setAccountMsisdn] = useState(s.platformAccountMsisdn ?? "");
  const [feeMode, setFeeMode] = useState(s.feeMode);
  const [feeValue, setFeeValue] = useState(String(s.feeValue));
  const [feeMin, setFeeMin] = useState(s.feeMin != null ? String(s.feeMin) : "");
  const [feeMax, setFeeMax] = useState(s.feeMax != null ? String(s.feeMax) : "");
  const [signups, setSignups] = useState(s.signupsEnabled);
  const [leader2fa, setLeader2fa] = useState(s.requireLeaderTwoFactor);
  const [supportEmail, setSupportEmail] = useState(s.supportEmail ?? "");
  const list = currencies
    .split(/[,\s]+/)
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
  const save = useMutation({
    mutationFn: () =>
      savePlatformSettings({
        supportedCurrencies: list,
        defaultCurrency,
        collectionMode,
        platformAccountName: accountName || null,
        platformAccountMsisdn: accountMsisdn || null,
        feeMode,
        feeValue: Number(feeValue) || 0,
        feeMin: feeMin === "" ? null : Number(feeMin),
        feeMax: feeMax === "" ? null : Number(feeMax),
        signupsEnabled: signups,
        requireLeaderTwoFactor: leader2fa,
        supportEmail: supportEmail || null,
      }),
    onSuccess: (r) => {
      toast.success("Platform settings saved.");
      qc.setQueryData(adminKeys.settings, r);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const field = "h-9 border-border bg-bg";

  return (
    <div className="max-w-3xl space-y-5">
      <Section title="Currencies">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="ps-cur" className="text-xs">Supported (ISO codes, comma separated)</Label>
            <Input id="ps-cur" value={currencies} onChange={(e) => setCurrencies(e.target.value)} className={field} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Default for new groups</Label>
            <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
              <SelectTrigger className={field}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(list.length ? list : [defaultCurrency]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-text-muted">Groups can only set up contributions and the social fund in these currencies.</p>
      </Section>

      <Section title="Collecting money">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">MTN MoMo account used</Label>
            <Select value={collectionMode} onValueChange={(v) => setCollectionMode(v as PlatformSettings["collectionMode"])}>
              <SelectTrigger className={field}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PLATFORM">Platform collection account for every group</SelectItem>
                <SelectItem value="PER_GROUP">Each group&apos;s own account when set up (else the platform&apos;s)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-an" className="text-xs">Platform account name (manual transfers)</Label>
            <Input id="ps-an" value={accountName} onChange={(e) => setAccountName(e.target.value)} className={field} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-am" className="text-xs">Platform MoMo number</Label>
            <Input id="ps-am" value={accountMsisdn} onChange={(e) => setAccountMsisdn(e.target.value)} placeholder="250788123456" className={field} />
          </div>
        </div>
        <p className="text-xs text-text-muted">Platform API keys come from the server environment; group keys are set on each group (Groups page).</p>
      </Section>

      <Section title="Platform fee on MoMo deposits">
        <div className="grid gap-3 sm:grid-cols-4">
          <div className="space-y-1">
            <Label className="text-xs">Fee</Label>
            <Select value={feeMode} onValueChange={(v) => setFeeMode(v as PlatformSettings["feeMode"])}>
              <SelectTrigger className={field}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">No fee</SelectItem>
                <SelectItem value="PERCENT">Percent</SelectItem>
                <SelectItem value="FLAT">Flat amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-fv" className="text-xs">{feeMode === "PERCENT" ? "Percent" : "Amount"}</Label>
            <Input id="ps-fv" type="number" min={0} step="0.01" disabled={feeMode === "NONE"} value={feeValue} onChange={(e) => setFeeValue(e.target.value)} className={field} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-fmin" className="text-xs">Minimum</Label>
            <Input id="ps-fmin" type="number" min={0} disabled={feeMode === "NONE"} value={feeMin} onChange={(e) => setFeeMin(e.target.value)} className={field} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ps-fmax" className="text-xs">Maximum</Label>
            <Input id="ps-fmax" type="number" min={0} disabled={feeMode === "NONE"} value={feeMax} onChange={(e) => setFeeMax(e.target.value)} className={field} />
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Added on top of what the member pays by MoMo and kept by the platform; it never enters a group&apos;s books. Manual transfers have no fee.
        </p>
      </Section>

      <Section title="Access">
        <label className="flex items-center gap-2 text-sm text-text">
          <Switch checked={signups} onCheckedChange={setSignups} /> Allow new sign-ups (invited people can always join)
        </label>
        <label className="flex items-center gap-2 text-sm text-text">
          <Switch checked={leader2fa} onCheckedChange={setLeader2fa} /> Group admins and treasurers must use two-step verification to
          approve or move money
        </label>
        <div className="max-w-sm space-y-1">
          <Label htmlFor="ps-se" className="text-xs">Support email shown to users</Label>
          <Input id="ps-se" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} className={field} />
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <Button disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="animate-spin" /> : null} Save settings
        </Button>
        <span className="text-xs text-text-muted">Last changed {fmtDateTime(s.updatedAt)}</span>
      </div>
    </div>
  );
}

export function PlatformAdmin() {
  const settings = usePlatformSettingsQuery();
  return (
    <PageShell title="Platform" description="How the platform is doing, and the settings that apply to every group.">
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="sms">SMS log</TabsTrigger>
          <TabsTrigger value="jobs">Jobs</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="overview">
            <Overview />
          </TabsContent>
          <TabsContent value="settings">
            {settings.isLoading ? (
              <Loading />
            ) : settings.data ? (
              <SettingsForm key={settings.data.updatedAt} s={settings.data} />
            ) : (
              <p className="text-sm text-destructive">{settings.error?.message}</p>
            )}
          </TabsContent>
          <TabsContent value="sms">
            <SmsLog />
          </TabsContent>
          <TabsContent value="jobs">
            <JobsPanel />
          </TabsContent>
        </div>
      </Tabs>
    </PageShell>
  );
}
