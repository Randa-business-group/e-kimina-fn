"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ChevronRight, Loader2, RotateCcw, Trash2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  rejectGroupVerification,
  removePaymentAccount,
  restoreGroup,
  savePaymentAccount,
  verifyGroup,
} from "@/lib/api/admin-api";
import { adminKeys, useAdminGroupQuery, useAdminGroupsQuery } from "@/lib/query/admin-queries";
import type { AdminGroupDetail, PaymentAccount } from "@/types/admin";
import type { JsonObject } from "@/types/json";
import {
  FilterChips,
  KV,
  Loading,
  PageShell,
  Pager,
  SearchBox,
  Section,
  StatusPill,
  VERIFICATION,
  fmtDate,
  fmtDateTime,
  money,
} from "./admin-ui";

type Filter = "" | "PENDING" | "VERIFIED" | "UNVERIFIED" | "REJECTED" | "deleted";

export function GroupsAdmin() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDeferredValue(search);
  const groups = useAdminGroupsQuery({
    search: q || undefined,
    verification: filter && filter !== "deleted" ? filter : undefined,
    deleted: filter === "deleted" ? "only" : undefined,
    page,
    pageSize: 25,
  });
  const c = groups.data?.counts ?? {};

  return (
    <PageShell title="Groups" description="Review verification requests, look into any group and set up group payment accounts.">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips<Filter>
          value={filter}
          onChange={(v) => {
            setFilter(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "PENDING", label: "Awaiting review", count: c.PENDING ?? 0 },
            { value: "VERIFIED", label: "Verified", count: c.VERIFIED ?? 0 },
            { value: "UNVERIFIED", label: "Not verified", count: c.UNVERIFIED ?? 0 },
            { value: "REJECTED", label: "Rejected", count: c.REJECTED ?? 0 },
            { value: "deleted", label: "Deleted", count: c.deleted ?? 0 },
          ]}
        />
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Group name or creator email"
        />
      </div>

      {groups.isLoading ? (
        <Loading />
      ) : groups.isError ? (
        <p className="text-sm text-destructive">{groups.error.message}</p>
      ) : (
        <>
          <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-secondary/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Group</th>
                  <th className="px-3 py-2 font-medium">Verification</th>
                  <th className="px-3 py-2 text-right font-medium">Members</th>
                  <th className="px-3 py-2 text-right font-medium">Savings fund</th>
                  <th className="px-3 py-2 font-medium">Payment account</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {groups.data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                      No groups match.
                    </td>
                  </tr>
                ) : (
                  groups.data?.items.map((g) => {
                    const v = VERIFICATION[g.verificationStatus];
                    return (
                      <tr key={g.id} className="cursor-pointer border-t border-border hover:bg-secondary/30" onClick={() => setOpenId(g.id)}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-text">
                            {g.name}
                            {g.deletedAt ? <span className="text-text-muted"> (deleted)</span> : null}
                          </p>
                          <p className="text-xs text-text-muted">{g.createdBy.fullName}</p>
                        </td>
                        <td className="px-3 py-2">
                          <StatusPill tone={v.tone}>{v.label}</StatusPill>
                          {g.verificationStatus === "PENDING" && g.verificationRequestedAt ? (
                            <p className="mt-1 text-xs text-text-muted">since {fmtDate(g.verificationRequestedAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-text">
                          {g.members}/{g.maxMembers}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-text">{money(g.savingsBalance)}</td>
                        <td className="px-3 py-2 text-text-muted">{g.hasPaymentAccount ? "Own account" : "Platform"}</td>
                        <td className="px-3 py-2 text-text-muted">{fmtDate(g.createdAt)}</td>
                        <td className="px-3 py-2 text-text-muted">
                          <ChevronRight className="size-4" />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {groups.data ? (
            <Pager page={page} totalPages={groups.data.totalPages} total={groups.data.total} onPage={setPage} busy={groups.isFetching} />
          ) : null}
        </>
      )}

      <Sheet open={Boolean(openId)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto bg-bg p-6 sm:max-w-xl">{openId ? <GroupDetail id={openId} /> : null}</SheetContent>
      </Sheet>
    </PageShell>
  );
}

function DetailsValue({ v }: { v: unknown }) {
  if (typeof v === "string" && /^https?:\/\//.test(v))
    return (
      <a href={v} target="_blank" rel="noreferrer noopener" className="text-primary underline underline-offset-2">
        Open file
      </a>
    );
  if (Array.isArray(v)) return <span className="flex flex-col gap-0.5">{v.map((x, i) => <DetailsValue key={i} v={x} />)}</span>;
  if (v && typeof v === "object") return <span className="font-mono text-xs">{JSON.stringify(v)}</span>;
  return <>{v == null || v === "" ? "—" : String(v)}</>;
}

function GroupDetail({ id }: { id: string }) {
  const q = useAdminGroupQuery(id);
  const qc = useQueryClient();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const act = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      toast.success("Saved.");
      setRejecting(false);
      setReason("");
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <p className="text-sm text-destructive">{q.error?.message ?? "Not found."}</p>;
  const g: AdminGroupDetail = q.data;
  const v = VERIFICATION[g.verification.status];
  const details = g.verification.details ?? {};
  const cur = g.contribution?.currency ?? "RWF";

  return (
    <div className="space-y-6">
      <SheetHeader className="space-y-1 text-left">
        <SheetTitle className="text-xl text-text">{g.name}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <StatusPill tone={v.tone}>{v.label}</StatusPill>
          {g.deletedAt ? <StatusPill tone="critical">Deleted {fmtDate(g.deletedAt)}</StatusPill> : null}
          <span>{g.isPublic ? "Public" : "Private"}</span>
        </div>
      </SheetHeader>

      <div className="flex flex-wrap gap-2">
        {g.verification.status !== "VERIFIED" && !g.deletedAt ? (
          <Button size="sm" disabled={act.isPending} onClick={() => act.mutate(() => verifyGroup(id))}>
            <BadgeCheck /> Verify group
          </Button>
        ) : null}
        {g.verification.status === "PENDING" ? (
          <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => setRejecting(true)}>
            <XCircle /> Reject request
          </Button>
        ) : null}
        {g.deletedAt ? (
          <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate(() => restoreGroup(id))}>
            <RotateCcw /> Restore group
          </Button>
        ) : null}
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/dashboard/admin/audit?groupId=${id}`}>Audit log</Link>
        </Button>
      </div>

      {g.deletedAt && g.deletionReason ? <p className="text-sm text-text-muted">Deleted because: {g.deletionReason}</p> : null}

      <Section title="Verification">
        <KV
          rows={[
            ["Requested", fmtDateTime(g.verification.requestedAt)],
            ...(g.verification.reviewedAt
              ? ([["Reviewed", `${fmtDateTime(g.verification.reviewedAt)}${g.verification.reviewedBy ? ` by ${g.verification.reviewedBy}` : ""}`]] as [string, string][])
              : []),
            ...(g.verification.rejectionReason ? ([["Rejection reason", g.verification.rejectionReason]] as [string, string][]) : []),
            ...Object.entries(details).map(([k, val]) => [k.replace(/([A-Z])/g, " $1").toLowerCase(), <DetailsValue key={k} v={val} />] as [string, React.ReactNode]),
          ]}
        />
      </Section>

      <Section title="Group">
        <KV
          rows={[
            ["Created", `${fmtDate(g.createdAt)} by ${g.createdBy.fullName} (${g.createdBy.email})`],
            ["Members", Object.entries(g.members).map(([s, n]) => `${n} ${s.toLowerCase().replace("_", " ")}`).join(" · ") || "—"],
            ["Size limits", `${g.minMembers}–${g.maxMembers}`],
            ["Contribution", g.contribution ? `${money(g.contribution.amount, cur)} ${g.contribution.interval.toLowerCase()}` : "Not set up"],
            ["Savings fund", money(g.balances.savings, cur)],
            ["Social fund", money(g.balances.social, cur)],
            ["Loans", `${g.loans.active} active · ${g.loans.defaulted} defaulted · ${g.loans.repaid} repaid`],
          ]}
        />
      </Section>

      <Section title="Leaders">
        <ul className="space-y-1 text-sm">
          {g.leaders.map((l) => (
            <li key={l.id + l.role} className="flex justify-between gap-3">
              <span className="text-text">{l.fullName}</span>
              <span className="text-xs text-text-muted">
                {l.role === "GROUP_ADMIN" ? "Admin" : "Treasurer"} · {l.phoneNumber ?? l.email}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <PaymentAccountForm groupId={id} account={g.paymentAccount} />

      <Section title="Recent activity">
        {g.recentActivity.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {g.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-xs text-text">{a.action}</span>
                <span className="shrink-0 text-xs text-text-muted">
                  {a.actorName ?? "system"} · {fmtDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Dialog open={rejecting} onOpenChange={setRejecting}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>Reject the verification request?</DialogTitle>
            <DialogDescription>The group admin sees this reason and can apply again.</DialogDescription>
          </DialogHeader>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="What is missing or wrong" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || act.isPending} onClick={() => act.mutate(() => rejectGroupVerification(id, reason))}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

const SECRET_FIELDS = [
  ["collectionUserId", "Collection API user"],
  ["collectionApiKey", "Collection API key"],
  ["collectionSubscriptionKey", "Collection subscription key"],
  ["disbursementUserId", "Disbursement API user"],
  ["disbursementApiKey", "Disbursement API key"],
  ["disbursementSubscriptionKey", "Disbursement subscription key"],
] as const;

function current(a: PaymentAccount | null, k: (typeof SECRET_FIELDS)[number][0]) {
  if (!a) return null;
  const side = k.startsWith("collection") ? a.collection : a.disbursement;
  return k.endsWith("UserId") ? side.userId : k.endsWith("ApiKey") ? side.apiKey : side.subscriptionKey;
}

function PaymentAccountForm({ groupId, account }: { groupId: string; account: PaymentAccount | null }) {
  const qc = useQueryClient();
  const [name, setName] = useState(account?.accountName ?? "");
  const [msisdn, setMsisdn] = useState(account?.msisdn ?? "");
  const [active, setActive] = useState(account?.isActive ?? true);
  const [secrets, setSecrets] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: () => {
      const body: JsonObject = { accountName: name || null, msisdn: msisdn || null, isActive: active };
      for (const [k, v] of Object.entries(secrets)) if (v.trim()) body[k] = v.trim();
      return savePaymentAccount(groupId, body);
    },
    onSuccess: () => {
      toast.success("Payment account saved.");
      setSecrets({});
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: () => removePaymentAccount(groupId),
    onSuccess: () => {
      toast.success("Payment account removed; the group uses the platform account.");
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Section title="Payment account (MTN MoMo)">
      <p className="text-xs text-text-muted">
        Used when the platform collects per group (Platform settings). Keys are stored encrypted and never shown again; leave a key empty
        to keep the saved one.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pa-name" className="text-xs">Account name</Label>
          <Input id="pa-name" value={name} onChange={(e) => setName(e.target.value)} className="h-9 border-border bg-bg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pa-msisdn" className="text-xs">MoMo number (for manual transfers)</Label>
          <Input id="pa-msisdn" value={msisdn} onChange={(e) => setMsisdn(e.target.value)} placeholder="250788123456" className="h-9 border-border bg-bg" />
        </div>
        {SECRET_FIELDS.map(([k, label]) => (
          <div key={k} className="space-y-1">
            <Label htmlFor={`pa-${k}`} className="text-xs">{label}</Label>
            <Input
              id={`pa-${k}`}
              type={k.endsWith("UserId") ? "text" : "password"}
              autoComplete="off"
              value={secrets[k] ?? ""}
              onChange={(e) => setSecrets((s) => ({ ...s, [k]: e.target.value }))}
              placeholder={current(account, k) ?? "Not set"}
              className="h-9 border-border bg-bg"
            />
          </div>
        ))}
      </div>
      <label className="flex items-center gap-2 text-sm text-text">
        <Switch checked={active} onCheckedChange={setActive} /> Account active
      </label>
      <div className="flex gap-2">
        <Button size="sm" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending ? <Loader2 className="animate-spin" /> : null} Save account
        </Button>
        {account ? (
          <Button size="sm" variant="outline" disabled={remove.isPending} onClick={() => remove.mutate()}>
            <Trash2 /> Remove
          </Button>
        ) : null}
      </div>
    </Section>
  );
}
