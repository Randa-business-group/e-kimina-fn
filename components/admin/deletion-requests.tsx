"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { approveDeletion, fetchDeletionRequests, rejectDeletion, type AdminDeletionRow } from "@/lib/api/account-api";
import { FilterChips, Loading, PageShell, StatusPill, fmtDate } from "./admin-ui";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "";

const TONE = { PENDING: "warning", APPROVED: "good", REJECTED: "critical", CANCELLED: "neutral" } as const;

/** Right-to-erasure requests (Rwanda Law No. 058/2021): answer within 30 days. */
export function DeletionRequests() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<Status>("PENDING");
  const list = useQuery({ queryKey: ["admin", "deletions", status], queryFn: () => fetchDeletionRequests(status || undefined) });
  const [target, setTarget] = useState<{ row: AdminDeletionRow; kind: "approve" | "reject" } | null>(null);
  const [note, setNote] = useState("");
  const act = useMutation({
    mutationFn: () => (target!.kind === "approve" ? approveDeletion(target!.row.id, note) : rejectDeletion(target!.row.id, note)),
    onSuccess: () => {
      toast.success(target?.kind === "approve" ? "Account erased." : "Request declined.");
      setTarget(null);
      setNote("");
      void qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <PageShell title="Deletion requests" description="People asking for their account to be erased. Answer within 30 days.">
      <FilterChips<Status>
        value={status}
        onChange={setStatus}
        options={[
          { value: "PENDING", label: "Waiting" },
          { value: "APPROVED", label: "Erased" },
          { value: "REJECTED", label: "Declined" },
          { value: "CANCELLED", label: "Cancelled" },
          { value: "", label: "All" },
        ]}
      />
      {list.isLoading ? (
        <Loading />
      ) : list.isError ? (
        <p className="text-sm text-destructive">{list.error.message}</p>
      ) : !list.data?.length ? (
        <p className="text-sm text-text-muted">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {list.data.map((r) => {
            const late = r.status === "PENDING" && new Date(r.dueBy) < new Date();
            return (
              <li key={r.id} className="space-y-2 rounded-(--radius) border border-border bg-bg p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-text">{r.user.fullName}</p>
                    <p className="text-xs text-text-muted">
                      {r.user.email} · asked {fmtDate(r.requestedAt)}
                      {r.status === "PENDING" ? ` · answer by ${fmtDate(r.dueBy)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {late ? <StatusPill tone="critical">Overdue</StatusPill> : null}
                    <StatusPill tone={TONE[r.status]}>{r.status.toLowerCase()}</StatusPill>
                  </div>
                </div>
                {r.reason ? <p className="text-sm text-text">“{r.reason}”</p> : null}
                {r.decisionNote ? <p className="text-sm text-text-muted">Note: {r.decisionNote}</p> : null}
                {r.blockers.length ? (
                  <ul className="list-disc space-y-0.5 pl-5 text-sm text-text-muted">
                    {r.blockers.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
                {r.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="destructive" disabled={r.blockers.length > 0} onClick={() => setTarget({ row: r, kind: "approve" })}>
                      Erase account
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTarget({ row: r, kind: "reject" })}>
                      Decline
                    </Button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{target?.kind === "approve" ? `Erase ${target.row.user.fullName}'s account?` : "Decline the request?"}</DialogTitle>
            <DialogDescription>
              {target?.kind === "approve"
                ? "Name, email, phone, photo, notifications and devices are removed and the person can no longer sign in. Group money records stay without their name. This cannot be undone."
                : "Tell the person why (for example: leave your group first)."}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={target?.kind === "approve" ? "Note (optional)" : "Reason"} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              variant={target?.kind === "approve" ? "destructive" : "default"}
              disabled={act.isPending || (target?.kind === "reject" && note.trim().length < 3)}
              onClick={() => act.mutate()}
            >
              {target?.kind === "approve" ? "Erase" : "Decline"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
