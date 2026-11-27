"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarPlus, ClipboardCheck, Download, Loader2, LogOut, MailPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient, authFetch } from "@/lib/api/api-client";
import { fetchStatement } from "@/lib/api/reports-api";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useGroupMembersQuery } from "@/lib/query/groups-queries";

/** Extra tabs on the group page (msfts §9): fines, loans, meetings, invitations, leaving. */

const g = (groupId: string) => `/groups/${encodeURIComponent(groupId)}`;
const get = async <T,>(p: string) => (await apiClient.get(p)) as unknown as T;

function Empty({ text }: { text: string }) {
  return <p className="py-6 text-sm text-text-muted">{text}</p>;
}

function Busy() {
  return <Loader2 className="my-6 size-4 animate-spin text-text-muted" />;
}

function useAct(keys: unknown[][], done?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => {
      for (const k of keys) void qc.invalidateQueries({ queryKey: k });
      done?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

async function downloadPath(path: string, fallbackName: string) {
  const res = await authFetch(path);
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? fallbackName;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

// ── fines ────────────────────────────────────────────────────────────────

type FineRow = {
  id: string;
  userId: string;
  userName: string;
  type: string;
  amount: number;
  amountPaid: number;
  remaining: number;
  currency: string;
  reason: string;
  status: string;
  createdAt: string;
};

const FINE_TYPES = ["LATE_CONTRIBUTION", "LATE_LOAN", "ABSENCE", "LATE_ARRIVAL", "MISCONDUCT", "OTHER"] as const;

export function FinesTab({ groupId, isLeader, myUserId }: { groupId: string; isLeader: boolean; myUserId?: string }) {
  const { t, money, date } = useI18n();
  const [status, setStatus] = useState("OPEN");
  const key = ["group-fines", groupId, status];
  const fines = useQuery({
    queryKey: key,
    queryFn: () => get<FineRow[]>(`${g(groupId)}/finance/fines${status ? `?status=${status}` : ""}`),
  });
  const members = useGroupMembersQuery(groupId, isLeader);
  const [waive, setWaive] = useState<FineRow | null>(null);
  const [reason, setReason] = useState("");
  const [issue, setIssue] = useState(false);
  const [form, setForm] = useState({ userId: "", type: "OTHER", amount: "", reason: "" });
  const act = useAct([["group-fines", groupId]], () => {
    setWaive(null);
    setIssue(false);
    setReason("");
    setForm({ userId: "", type: "OTHER", amount: "", reason: "" });
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Select value={status || "ALL"} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
          <SelectTrigger className="h-9 w-40 border-border bg-bg">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">{t("fines.open")}</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="WAIVED">Waived</SelectItem>
            <SelectItem value="ALL">{t("common.all")}</SelectItem>
          </SelectContent>
        </Select>
        {isLeader ? (
          <Button size="sm" onClick={() => setIssue(true)}>
            {t("fines.issue")}
          </Button>
        ) : null}
      </div>
      {fines.isLoading ? (
        <Busy />
      ) : !fines.data?.length ? (
        <Empty text={t("group.empty")} />
      ) : (
        <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
          <table className="w-full min-w-150 text-sm">
            <thead className="bg-secondary/60 text-left text-xs text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">{t("fines.date")}</th>
                {isLeader ? <th className="px-3 py-2 font-medium">{t("fines.member")}</th> : null}
                <th className="px-3 py-2 font-medium">{t("fines.reason")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("fines.amount")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("fines.left")}</th>
                <th className="px-3 py-2 font-medium">{t("fines.status")}</th>
                {isLeader ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {fines.data.map((f) => (
                <tr key={f.id} className="border-t border-border">
                  <td className="whitespace-nowrap px-3 py-2 text-text-muted">{date(f.createdAt)}</td>
                  {isLeader ? <td className="px-3 py-2 text-text">{f.userName}</td> : null}
                  <td className="px-3 py-2 text-text">{f.reason}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text">{money(f.amount, f.currency)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-text">{money(f.remaining, f.currency)}</td>
                  <td className="px-3 py-2 text-xs text-text-muted">{f.status.toLowerCase().replace("_", " ")}</td>
                  {isLeader ? (
                    <td className="px-3 py-2 text-right">
                      {f.status === "OPEN" || f.status === "PARTIALLY_PAID" ? (
                        <Button size="sm" variant="ghost" onClick={() => setWaive(f)}>
                          {t("fines.waive")}
                        </Button>
                      ) : null}
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={Boolean(waive)} onOpenChange={(o) => !o && setWaive(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{t("fines.waive")}</DialogTitle>
            <DialogDescription>
              {waive?.userName} · {waive ? money(waive.remaining, waive.currency) : ""}
            </DialogDescription>
          </DialogHeader>
          <Label className="text-xs">{t("fines.waiveReason")}</Label>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaive(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={reason.trim().length < 3 || act.isPending}
              onClick={() => act.mutate(() => apiClient.post(`${g(groupId)}/finance/fines/${waive!.id}/waive`, { reason: reason.trim() }))}
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={issue} onOpenChange={setIssue}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{t("fines.issue")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Select value={form.userId} onValueChange={(v) => setForm({ ...form, userId: v })}>
              <SelectTrigger className="border-border bg-bg">
                <SelectValue placeholder={t("fines.member")} />
              </SelectTrigger>
              <SelectContent>
                {(members.data ?? [])
                  .filter((m) => m.membershipStatus === "ACTIVE" && m.userId !== myUserId)
                  .map((m) => (
                    <SelectItem key={m.userId} value={m.userId}>
                      {m.fullName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
              <SelectTrigger className="border-border bg-bg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FINE_TYPES.map((ft) => (
                  <SelectItem key={ft} value={ft}>
                    {ft.toLowerCase().replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" min={1} placeholder={t("fines.amount")} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Textarea rows={2} placeholder={t("fines.reason")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIssue(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={!form.userId || !(Number(form.amount) > 0) || form.reason.trim().length < 3 || act.isPending}
              onClick={() =>
                act.mutate(() =>
                  apiClient.post(`${g(groupId)}/finance/fines`, {
                    userId: form.userId,
                    type: form.type,
                    amount: Number(form.amount),
                    reason: form.reason.trim(),
                  }),
                )
              }
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── loans ────────────────────────────────────────────────────────────────

type MemberLoanRow = {
  id: string;
  userName: string;
  principal: number;
  outstanding: number;
  currency: string;
  dueDate: string;
  status: string;
  isOverdue: boolean;
};
type ApplicationRow = {
  id: string;
  userName: string;
  requestedAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  waitingOn: string | null;
  purpose: string | null;
};

export function GroupLoansTab({ groupId, isLeader }: { groupId: string; isLeader: boolean }) {
  const { t, money, date } = useI18n();
  const loans = useQuery({
    queryKey: ["group-member-loans", groupId],
    queryFn: () => get<MemberLoanRow[]>(`${g(groupId)}/finance/member-loans`),
    enabled: isLeader,
  });
  const apps = useQuery({
    queryKey: ["group-loan-apps", groupId],
    queryFn: () => get<ApplicationRow[]>(`${g(groupId)}/finance/loan-applications`),
    enabled: isLeader,
  });
  const mine = useQuery({
    queryKey: ["group-my-statement", groupId],
    queryFn: () => fetchStatement(groupId, {}),
    enabled: !isLeader,
  });
  const pdf = (id: string) =>
    void downloadPath(`${g(groupId)}/finance/member-loans/${id}/statement.pdf`, `loan-${id}.pdf`).catch((e: Error) => toast.error(e.message));

  if (!isLeader) {
    if (mine.isLoading) return <Busy />;
    const rows = mine.data?.loans ?? [];
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-text">{t("loans.mine")}</h3>
        {!rows.length ? (
          <Empty text={t("loans.none")} />
        ) : (
          <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">
            {rows.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="text-text">
                    {money(l.principal)} · {l.status.toLowerCase()}
                  </p>
                  <p className="text-xs text-text-muted">
                    {date(l.disbursedAt)} → {date(l.dueDate)} · {t("loans.outstanding")} {money(l.outstanding)}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => pdf(l.id)}>
                  <Download /> {t("loans.statement")}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const pending = (apps.data ?? []).filter((a) => a.status === "PENDING");
  return (
    <div className="space-y-5">
      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-text">{t("loans.pending")}</h3>
        {apps.isLoading ? (
          <Busy />
        ) : !pending.length ? (
          <Empty text={t("group.empty")} />
        ) : (
          <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">
            {pending.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="text-text">
                    {a.userName} · {money(a.requestedAmount, a.currency)}
                  </p>
                  <p className="text-xs text-text-muted">
                    {date(a.createdAt)}
                    {a.purpose ? ` · ${a.purpose}` : ""}
                    {a.waitingOn ? ` · ${t("loans.waitingOn", { who: a.waitingOn })}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-text-muted">
          Approve or reject from <a className="text-primary underline" href="/dashboard/loans-management">Loans management</a>.
        </p>
      </section>
      <section className="space-y-2">
        {loans.isLoading ? (
          <Busy />
        ) : !loans.data?.length ? (
          <Empty text={t("loans.none")} />
        ) : (
          <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
            <table className="w-full min-w-150 text-sm">
              <thead className="bg-secondary/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">{t("loans.borrower")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("loans.principal")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("loans.outstanding")}</th>
                  <th className="px-3 py-2 font-medium">{t("loans.due")}</th>
                  <th className="px-3 py-2 font-medium">{t("loans.status")}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {loans.data.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-3 py-2 text-text">{l.userName}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-text">{money(l.principal, l.currency)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-text">{money(l.outstanding, l.currency)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-text-muted">{date(l.dueDate)}</td>
                    <td className="px-3 py-2 text-xs">
                      <span className={l.isOverdue || l.status === "DEFAULTED" ? "font-medium text-destructive" : "text-text-muted"}>
                        {l.isOverdue && l.status === "ACTIVE" ? "overdue" : l.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" aria-label={t("loans.statement")} onClick={() => pdf(l.id)}>
                        <Download />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

// ── meetings ─────────────────────────────────────────────────────────────

type Meeting = {
  id: string;
  title: string;
  scheduledAt: string;
  location: string | null;
  agenda: string | null;
  status: string;
  minutesText: string | null;
  myAttendance: string | null;
  counts: Record<string, number>;
};

const ATT = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const;
const attLabel = (s: string) => `meet.${s.toLowerCase()}`;

export function MeetingsTab({ groupId, isLeader }: { groupId: string; isLeader: boolean }) {
  const { t, dateTime } = useI18n();
  const key = ["group-meetings", groupId];
  const meetings = useQuery({ queryKey: key, queryFn: () => get<Meeting[]>(`${g(groupId)}/governance/meetings?scope=all`) });
  const members = useGroupMembersQuery(groupId, isLeader);
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState({ title: "", when: "", location: "", agenda: "" });
  const [att, setAtt] = useState<Meeting | null>(null);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [minutes, setMinutes] = useState<Meeting | null>(null);
  const [minutesText, setMinutesText] = useState("");
  const act = useAct([key], () => {
    setCreate(false);
    setAtt(null);
    setMinutes(null);
    setForm({ title: "", when: "", location: "", agenda: "" });
  });
  const [now] = useState(() => Date.now());
  const list = meetings.data ?? [];
  const upcoming = list.filter((m) => new Date(m.scheduledAt).getTime() >= now && m.status === "SCHEDULED");
  const past = list.filter((m) => !upcoming.includes(m));

  const card = (m: Meeting) => (
    <li key={m.id} className="space-y-1 px-4 py-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium text-text">{m.title}</p>
          <p className="text-xs text-text-muted">
            {dateTime(m.scheduledAt)}
            {m.location ? ` · ${m.location}` : ""} · {m.status.toLowerCase()}
          </p>
        </div>
        {isLeader && m.status !== "CANCELLED" ? (
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAtt(m);
                setMarks({});
              }}
            >
              <ClipboardCheck /> {t("meet.attendance")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setMinutes(m);
                setMinutesText(m.minutesText ?? "");
              }}
            >
              {t("meet.minutes")}
            </Button>
            {m.status === "SCHEDULED" ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => act.mutate(() => apiClient.post(`${g(groupId)}/governance/meetings/${m.id}/cancel`, { reason: "Cancelled by a leader" }))}
              >
                {t("meet.cancel")}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {m.agenda ? <p className="text-text-muted">{m.agenda}</p> : null}
      {m.minutesText ? <p className="whitespace-pre-line rounded-md bg-secondary/40 p-2 text-text">{m.minutesText}</p> : null}
      {m.myAttendance ? <p className="text-xs text-text-muted">{t("meet.yourAttendance", { status: t(attLabel(m.myAttendance)) })}</p> : null}
      {m.status === "HELD" ? (
        <p className="text-xs text-text-muted">{ATT.map((s) => `${t(attLabel(s))}: ${m.counts[s] ?? 0}`).join(" · ")}</p>
      ) : null}
    </li>
  );

  return (
    <div className="space-y-4">
      {isLeader ? (
        <Button size="sm" onClick={() => setCreate(true)}>
          <CalendarPlus /> {t("meet.schedule")}
        </Button>
      ) : null}
      {meetings.isLoading ? (
        <Busy />
      ) : (
        <>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-text">{t("meet.upcoming")}</h3>
            {upcoming.length ? <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">{upcoming.map(card)}</ul> : <Empty text={t("group.empty")} />}
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-semibold text-text">{t("meet.past")}</h3>
            {past.length ? <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">{past.map(card)}</ul> : <Empty text={t("group.empty")} />}
          </section>
        </>
      )}

      <Dialog open={create} onOpenChange={setCreate}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{t("meet.schedule")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <Input placeholder={t("meet.title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input type="datetime-local" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} aria-label={t("meet.when")} />
            <Input placeholder={t("meet.where")} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <Textarea rows={3} placeholder={t("meet.agenda")} value={form.agenda} onChange={(e) => setForm({ ...form, agenda: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreate(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={form.title.trim().length < 3 || !form.when || act.isPending}
              onClick={() =>
                act.mutate(() =>
                  apiClient.post(`${g(groupId)}/governance/meetings`, {
                    title: form.title.trim(),
                    scheduledAt: new Date(form.when).toISOString(),
                    ...(form.location.trim() ? { location: form.location.trim() } : {}),
                    ...(form.agenda.trim() ? { agenda: form.agenda.trim() } : {}),
                  }),
                )
              }
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(att)} onOpenChange={(o) => !o && setAtt(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-bg">
          <DialogHeader>
            <DialogTitle>{t("meet.attendance")}</DialogTitle>
            <DialogDescription>{att?.title}</DialogDescription>
          </DialogHeader>
          <ul className="divide-y divide-border">
            {(members.data ?? [])
              .filter((m) => m.membershipStatus === "ACTIVE")
              .map((m) => (
                <li key={m.userId} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="text-text">{m.fullName}</span>
                  <Select value={marks[m.userId] ?? ""} onValueChange={(v) => setMarks({ ...marks, [m.userId]: v })}>
                    <SelectTrigger className="h-8 w-36 border-border bg-bg">
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {ATT.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(attLabel(s))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
          </ul>
          <DialogFooter>
            <Button
              disabled={!Object.keys(marks).length || act.isPending}
              onClick={() =>
                act.mutate(() =>
                  apiClient.put(`${g(groupId)}/governance/meetings/${att!.id}/attendance`, {
                    entries: Object.entries(marks).map(([userId, status]) => ({ userId, status })),
                  }),
                )
              }
            >
              {t("meet.saveAttendance")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(minutes)} onOpenChange={(o) => !o && setMinutes(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{t("meet.minutes")}</DialogTitle>
            <DialogDescription>{minutes?.title}</DialogDescription>
          </DialogHeader>
          <Textarea rows={8} value={minutesText} onChange={(e) => setMinutesText(e.target.value)} />
          <DialogFooter>
            <Button
              disabled={!minutesText.trim() || act.isPending}
              onClick={() => act.mutate(() => apiClient.put(`${g(groupId)}/governance/meetings/${minutes!.id}/minutes`, { minutesText: minutesText.trim() }))}
            >
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── invitations ──────────────────────────────────────────────────────────

type Invitation = { id: string; kind: "MEMBER" | "TREASURER"; email: string; createdAt: string; expiresAt: string; expired: boolean };

export function InvitationsTab({ groupId }: { groupId: string }) {
  const { t, date } = useI18n();
  const key = ["group-invitations", groupId];
  const inv = useQuery({ queryKey: key, queryFn: () => get<Invitation[]>(`${g(groupId)}/governance/invitations`) });
  const act = useAct([key], () => toast.success("Done."));
  if (inv.isLoading) return <Busy />;
  if (!inv.data?.length) return <Empty text={t("inv.none")} />;
  return (
    <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">
      {inv.data.map((i) => (
        <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
          <div>
            <p className="text-text">{i.email}</p>
            <p className="text-xs text-text-muted">
              {t("inv.kind")} {i.kind.toLowerCase()} · {t("inv.expires")} {date(i.expiresAt)}
              {i.expired ? ` (${t("inv.expired")})` : ""}
            </p>
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={act.isPending} onClick={() => act.mutate(() => apiClient.post(`${g(groupId)}/governance/invitations/${i.id}/resend`))}>
              <MailPlus /> {t("inv.resend")}
            </Button>
            <Button size="sm" variant="ghost" disabled={act.isPending} onClick={() => act.mutate(() => apiClient.delete(`${g(groupId)}/governance/invitations/${i.id}`))}>
              <Trash2 /> {t("inv.revoke")}
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ── leaving ──────────────────────────────────────────────────────────────

type ExitFigures = {
  savingsBase: number;
  fineDeduction: number;
  loanDeduction: number;
  uncoveredDebt: number;
  refundAmount: number;
};
type ExitRow = {
  id: string;
  userId: string;
  fullName: string;
  kind: string;
  status: string;
  reason: string;
  createdAt: string;
  figures: ExitFigures;
};

export function LeaveTab({ groupId, isLeader, myUserId }: { groupId: string; isLeader: boolean; myUserId?: string }) {
  const { t, money, date } = useI18n();
  const exitsKey = ["group-exits", groupId];
  const preview = useQuery({ queryKey: ["exit-preview", groupId], queryFn: () => get<ExitFigures>(`${g(groupId)}/governance/exits/preview`) });
  const exits = useQuery({ queryKey: exitsKey, queryFn: () => get<ExitRow[]>(`${g(groupId)}/governance/exits?status=PENDING`) });
  const [reason, setReason] = useState("");
  const [settle, setSettle] = useState<ExitRow | null>(null);
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const act = useAct([exitsKey, ["exit-preview", groupId]], () => {
    setSettle(null);
    setReason("");
    setReference("");
  });
  const mine = (exits.data ?? []).find((e) => e.userId === myUserId);
  const others = (exits.data ?? []).filter((e) => e.userId !== myUserId);
  const p = preview.data;

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-(--radius) border border-border bg-bg p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <LogOut className="size-4" /> {t("leave.title")}
        </h3>
        <p className="text-sm text-text-muted">{t("leave.body")}</p>
        {p ? (
          <dl className="grid max-w-md grid-cols-[1fr_auto] gap-y-1 text-sm">
            <dt className="text-text-muted">{t("leave.savings")}</dt>
            <dd className="text-right tabular-nums text-text">{money(p.savingsBase)}</dd>
            <dt className="text-text-muted">{t("leave.debts")}</dt>
            <dd className="text-right tabular-nums text-text">− {money(p.fineDeduction + p.loanDeduction)}</dd>
            <dt className="font-medium text-text">{t("leave.refund")}</dt>
            <dd className="text-right font-semibold tabular-nums text-text">{money(p.refundAmount)}</dd>
            {p.uncoveredDebt > 0 ? (
              <>
                <dt className="text-destructive">{t("leave.uncovered")}</dt>
                <dd className="text-right tabular-nums text-destructive">{money(p.uncoveredDebt)}</dd>
              </>
            ) : null}
          </dl>
        ) : preview.isLoading ? (
          <Busy />
        ) : null}
        {mine ? (
          <p className="text-sm font-medium text-text">{t("leave.pending")}</p>
        ) : (
          <>
            <Textarea rows={2} placeholder={t("leave.reason")} value={reason} onChange={(e) => setReason(e.target.value)} className="max-w-xl" />
            <Button
              variant="destructive"
              size="sm"
              disabled={reason.trim().length < 3 || act.isPending}
              onClick={() => act.mutate(() => apiClient.post(`${g(groupId)}/governance/exits`, { reason: reason.trim() }))}
            >
              {t("leave.request")}
            </Button>
          </>
        )}
      </section>

      {isLeader ? (
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text">{t("leave.requests")}</h3>
          {!others.length ? (
            <Empty text={t("group.empty")} />
          ) : (
            <ul className="divide-y divide-border rounded-(--radius) border border-border bg-bg">
              {others.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="text-text">
                      {e.fullName} · {t("leave.refund")} {money(e.figures.refundAmount)}
                    </p>
                    <p className="text-xs text-text-muted">
                      {date(e.createdAt)} · “{e.reason}”
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => setSettle(e)}>
                      {t("leave.settle")}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={act.isPending}
                      onClick={() => act.mutate(() => apiClient.post(`${g(groupId)}/governance/exits/${e.id}/reject`, { reason: "Declined by a leader" }))}
                    >
                      {t("leave.reject")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <Dialog open={Boolean(settle)} onOpenChange={(o) => !o && setSettle(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{t("leave.settle")}</DialogTitle>
            <DialogDescription>
              {settle?.fullName} · {settle ? money(settle.figures.refundAmount) : ""}
            </DialogDescription>
          </DialogHeader>
          <Label className="text-xs">{t("leave.method")}</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger className="border-border bg-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
              <SelectItem value="MTN_MOMO">MTN MoMo</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder={t("common.reference")} value={reference} onChange={(e) => setReference(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettle(null)}>
              {t("common.cancel")}
            </Button>
            <Button
              disabled={act.isPending}
              onClick={() =>
                act.mutate(() =>
                  apiClient.post(`${g(groupId)}/governance/exits/${settle!.id}/settle`, {
                    method,
                    ...(reference.trim() ? { reference: reference.trim() } : {}),
                  }),
                )
              }
            >
              {t("common.confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
