"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api/api-client";
import { Loading, StatusPill, fmtDateTime } from "./admin-ui";

type JobsSummary = {
  worker: { enabled: boolean; id: string };
  counts: Partial<Record<"PENDING" | "RUNNING" | "DONE" | "FAILED" | "DEAD", number>>;
  backlog: { type: string; status: string; count: number }[];
  oldestPendingSeconds: number;
  problems: {
    id: string;
    type: string;
    status: "FAILED" | "DEAD";
    attempts: number;
    maxAttempts: number;
    lastError: string | null;
    runAt: string;
    createdAt: string;
  }[];
};

/** Background job queue: emails, SMS, push and MoMo checks (msfts §10). */
export function JobsPanel() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "jobs"],
    queryFn: async () => (await apiClient.get("/admin/jobs")) as unknown as JobsSummary,
    refetchInterval: 15_000,
  });
  const retry = useMutation({
    mutationFn: (id: string) => apiClient.post(`/admin/jobs/${id}/retry`),
    onSuccess: () => {
      toast.success("Queued again.");
      void qc.invalidateQueries({ queryKey: ["admin", "jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isLoading) return <Loading />;
  if (q.isError || !q.data) return <p className="text-sm text-destructive">{q.error?.message}</p>;
  const d = q.data;
  const c = d.counts;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(["PENDING", "RUNNING", "FAILED", "DEAD", "DONE"] as const).map((s) => (
          <div key={s} className="rounded-(--radius) border border-border bg-bg p-3">
            <p className="text-xs text-text-muted">{s === "FAILED" ? "Waiting to retry" : s.toLowerCase()}</p>
            <p className="text-xl font-semibold tabular-nums text-text">{c[s] ?? 0}</p>
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted">
        Worker {d.worker.enabled ? "running" : "off on this server"} · oldest waiting job{" "}
        {d.oldestPendingSeconds ? `${d.oldestPendingSeconds}s` : "none"}
      </p>
      {d.backlog.length ? (
        <ul className="flex flex-wrap gap-2 text-xs">
          {d.backlog.map((b) => (
            <li key={`${b.type}-${b.status}`} className="rounded-sm border border-border px-2 py-0.5 text-text">
              {b.type} · {b.status.toLowerCase()} · {b.count}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
        <table className="w-full min-w-180 text-sm">
          <thead className="bg-secondary/60 text-left text-xs text-text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Job</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Attempts</th>
              <th className="px-3 py-2 font-medium">Last error</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {!d.problems.length ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-text-muted">
                  No failed jobs.
                </td>
              </tr>
            ) : (
              d.problems.map((j) => (
                <tr key={j.id} className="border-t border-border align-top">
                  <td className="px-3 py-2 font-mono text-xs text-text">{j.type}</td>
                  <td className="px-3 py-2">
                    <StatusPill tone={j.status === "DEAD" ? "critical" : "warning"}>
                      {j.status === "DEAD" ? "gave up" : `retry ${fmtDateTime(j.runAt)}`}
                    </StatusPill>
                  </td>
                  <td className="px-3 py-2 tabular-nums text-text">
                    {j.attempts}/{j.maxAttempts}
                  </td>
                  <td className="max-w-80 break-words px-3 py-2 text-xs text-text-muted">{j.lastError ?? "—"}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-text-muted">{fmtDateTime(j.createdAt)}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" disabled={retry.isPending} onClick={() => retry.mutate(j.id)}>
                      <RotateCcw /> Retry
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
