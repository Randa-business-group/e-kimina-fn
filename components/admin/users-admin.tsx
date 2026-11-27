"use client";

import { useDeferredValue, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Eye, KeyRound, Loader2, LockOpen, MailCheck, MailPlus, ShieldBan, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  beginImpersonation,
  impersonateUser,
  reactivateUser,
  resendUserVerification,
  resetUserAccess,
  suspendUser,
  unlockUser,
  verifyUserEmail,
} from "@/lib/api/admin-api";
import { adminKeys, useAdminUserQuery, useAdminUsersQuery } from "@/lib/query/admin-queries";
import type { AdminUserDetail } from "@/types/admin";
import {
  FilterChips,
  KV,
  Loading,
  PageShell,
  Pager,
  SearchBox,
  Section,
  StatusPill,
  USER_STATUS,
  fmtDate,
  fmtDateTime,
  money,
} from "./admin-ui";

type StatusFilter = "" | "active" | "suspended" | "locked" | "unverified" | "pending";

export function UsersAdmin() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const q = useDeferredValue(search);
  const users = useAdminUsersQuery({ search: q || undefined, status: status || undefined, page, pageSize: 25 });
  const c = users.data?.counts;

  return (
    <PageShell title="Users" description="Search accounts, suspend or restore access, and help people who are locked out.">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips<StatusFilter>
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "All", count: c?.all },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended", count: c?.suspended },
            { value: "locked", label: "Locked", count: c?.locked },
            { value: "unverified", label: "Email not verified", count: c?.unverified },
            { value: "pending", label: "Invited", count: c?.pending },
          ]}
        />
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Name, email or phone"
        />
      </div>

      {users.isLoading ? (
        <Loading />
      ) : users.isError ? (
        <p className="text-sm text-destructive">{users.error.message}</p>
      ) : (
        <>
          <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-secondary/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">Person</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 text-right font-medium">Groups</th>
                  <th className="px-3 py-2 font-medium">Last sign-in</th>
                  <th className="px-3 py-2 font-medium">Joined</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {users.data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-text-muted">
                      No accounts match.
                    </td>
                  </tr>
                ) : (
                  users.data?.items.map((u) => (
                    <tr
                      key={u.id}
                      className="cursor-pointer border-t border-border hover:bg-secondary/30"
                      onClick={() => setOpenId(u.id)}
                    >
                      <td className="px-3 py-2">
                        <p className="font-medium text-text">{u.fullName}</p>
                        <p className="text-xs text-text-muted">{u.email}</p>
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill tone={USER_STATUS[u.status]?.tone ?? "neutral"}>{USER_STATUS[u.status]?.label ?? u.status}</StatusPill>
                      </td>
                      <td className="px-3 py-2 text-text">{u.platformRole === "SUPER_ADMIN" ? "Super admin" : "User"}</td>
                      <td className="px-3 py-2 text-right tabular-nums text-text">{u.groups}</td>
                      <td className="px-3 py-2 text-text-muted">{fmtDateTime(u.lastLoginAt)}</td>
                      <td className="px-3 py-2 text-text-muted">{fmtDate(u.createdAt)}</td>
                      <td className="px-3 py-2 text-text-muted">
                        <ChevronRight className="size-4" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {users.data ? (
            <Pager page={page} totalPages={users.data.totalPages} total={users.data.total} onPage={setPage} busy={users.isFetching} />
          ) : null}
        </>
      )}

      <Sheet open={Boolean(openId)} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full overflow-y-auto bg-bg p-6 sm:max-w-xl">
          {openId ? <UserDetail id={openId} /> : null}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}

function UserDetail({ id }: { id: string }) {
  const q = useAdminUserQuery(id);
  const qc = useQueryClient();
  const router = useRouter();
  const [dialog, setDialog] = useState<null | "suspend" | "reset" | "impersonate">(null);
  const [reason, setReason] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const act = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: (r) => {
      const m = r && typeof r === "object" && "message" in r ? String((r as { message: unknown }).message) : "Done.";
      toast.success(m);
      setDialog(null);
      setReason("");
      void qc.invalidateQueries({ queryKey: adminKeys.all });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const impersonate = useMutation({
    mutationFn: () => impersonateUser(id),
    onSuccess: (r) => {
      beginImpersonation(r);
      qc.clear();
      router.push("/dashboard");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <p className="text-sm text-destructive">{q.error?.message ?? "Not found."}</p>;
  const u: AdminUserDetail = q.data;
  const isSuper = u.platformRole === "SUPER_ADMIN";
  const busy = act.isPending || impersonate.isPending;
  const s = USER_STATUS[u.status];

  return (
    <div className="space-y-6">
      <SheetHeader className="space-y-1 text-left">
        <SheetTitle className="text-xl text-text">{u.fullName}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
          <span>{u.email}</span>
          <StatusPill tone={s?.tone ?? "neutral"}>{s?.label ?? u.status}</StatusPill>
          {isSuper ? <StatusPill tone="info">Super admin</StatusPill> : null}
        </div>
      </SheetHeader>

      {!isSuper ? (
        <div className="flex flex-wrap gap-2">
          {u.suspendedAt ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => act.mutate(() => reactivateUser(id))}>
              <ShieldCheck /> Reactivate
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("suspend")}>
              <ShieldBan /> Suspend
            </Button>
          )}
          {u.status === "LOCKED" ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => act.mutate(() => unlockUser(id))}>
              <LockOpen /> Unlock
            </Button>
          ) : null}
          <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("reset")}>
            <KeyRound /> Reset access
          </Button>
          {!u.emailVerified && u.isActive ? (
            <>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act.mutate(() => resendUserVerification(id))}>
                <MailPlus /> Resend code
              </Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => act.mutate(() => verifyUserEmail(id))}>
                <MailCheck /> Mark verified
              </Button>
            </>
          ) : null}
          {u.isActive ? (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => setDialog("impersonate")}>
              <Eye /> View as user
            </Button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-text-muted">Super admin accounts are managed outside this screen.</p>
      )}

      {u.suspendedAt ? (
        <p className="rounded-(--radius) border border-border bg-secondary/40 p-3 text-sm text-text">
          Suspended {fmtDateTime(u.suspendedAt)}: {u.suspensionReason}
        </p>
      ) : null}

      <Section title="Account">
        <KV
          rows={[
            ["Phone", u.phoneNumber ?? "—"],
            ["Joined", fmtDate(u.createdAt)],
            ["Last sign-in", fmtDateTime(u.lastLoginAt)],
            ["Email verified", u.emailVerified ? "Yes" : "No"],
            ["Failed sign-ins", u.lockedUntil ? `Locked until ${fmtDateTime(u.lockedUntil)}` : String(u.failedLoginAttempts)],
            ["Deposits", `${u.money.confirmedDeposits} · ${money(u.money.depositedTotal)}`],
            ["Open loans", String(u.money.openLoans)],
          ]}
        />
      </Section>

      <Section title={`Groups (${u.memberships.length})`}>
        {u.memberships.length === 0 ? (
          <p className="text-sm text-text-muted">Not in any group.</p>
        ) : (
          <ul className="divide-y divide-border rounded-(--radius) border border-border">
            {u.memberships.map((m) => (
              <li key={m.groupId} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate text-text">
                  {m.groupName}
                  {m.groupDeleted ? <span className="text-text-muted"> (deleted)</span> : null}
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  {m.role.replace("_", " ").toLowerCase()} · {m.membershipStatus.toLowerCase().replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Recent activity">
        {u.recentActivity.length === 0 ? (
          <p className="text-sm text-text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-1.5 text-sm">
            {u.recentActivity.map((a) => (
              <li key={a.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate font-mono text-xs text-text">{a.action}</span>
                <span className="shrink-0 text-xs text-text-muted">
                  {a.actorId !== id && a.actorName ? `by ${a.actorName} · ` : ""}
                  {fmtDateTime(a.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Dialog open={dialog === "suspend"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>Suspend {u.fullName}?</DialogTitle>
            <DialogDescription>They are signed out everywhere and cannot sign in until you reactivate the account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="suspend-reason">Reason (kept in the audit log)</Label>
            <Textarea id="suspend-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={reason.trim().length < 3 || busy} onClick={() => act.mutate(() => suspendUser(id, reason))}>
              {busy ? <Loader2 className="animate-spin" /> : null} Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reset"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>Reset access for {u.fullName}?</DialogTitle>
            <DialogDescription>Ends every session on every device and clears any sign-in lockout.</DialogDescription>
          </DialogHeader>
          <label className="flex items-center gap-2 text-sm text-text">
            <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} />
            Email them a password-reset code
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => act.mutate(() => resetUserAccess(id, sendEmail))}>
              {busy ? <Loader2 className="animate-spin" /> : null} Reset access
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "impersonate"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>View the app as {u.fullName}?</DialogTitle>
            <DialogDescription>
              A read-only support session for 30 minutes. You can look at everything they see but cannot change anything. The session
              is recorded in the audit log.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => impersonate.mutate()}>
              {impersonate.isPending ? <Loader2 className="animate-spin" /> : <Eye />} Start read-only session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
