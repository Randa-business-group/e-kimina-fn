"use client";

import { Fragment, useDeferredValue, useState } from "react";
import { ChevronDown, ChevronRight, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { auditPath, type AuditFilter } from "@/lib/api/admin-api";
import { downloadReport } from "@/lib/api/reports-api";
import { useAuditActionsQuery, useAuditQuery } from "@/lib/query/admin-queries";
import type { AuditRow } from "@/types/admin";
import { Loading, Pager, SearchBox, StatusPill, fmtDateTime } from "./admin-ui";

/** Common action families (group scope has no action listing endpoint). */
const FAMILIES = [
  ["deposit.", "Deposits"],
  ["loan.", "Loans"],
  ["fine.", "Fines"],
  ["config.", "Settings changes"],
  ["member.", "Members & roles"],
  ["expense.", "Expenses"],
  ["social_payout.", "Social fund"],
  ["shareout.", "Share-out"],
  ["ledger.", "Ledger adjustments"],
  ["group.", "Group"],
  ["auth.", "Sign-in & security"],
  ["admin.", "Platform admin"],
] as const;

function Changes({ row }: { row: AuditRow }) {
  const keys = [...new Set([...Object.keys(row.before ?? {}), ...Object.keys(row.after ?? {})])];
  const meta = row.meta ?? {};
  const show = (v: unknown) => (v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));
  return (
    <div className="space-y-3 bg-secondary/30 px-4 py-3 text-xs">
      {keys.length ? (
        <table className="w-full max-w-3xl">
          <thead className="text-left text-text-muted">
            <tr>
              <th className="py-1 pr-4 font-medium">Field</th>
              <th className="py-1 pr-4 font-medium">Before</th>
              <th className="py-1 font-medium">After</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k} className="border-t border-border align-top">
                <td className="py-1 pr-4 font-mono text-text">{k}</td>
                <td className="break-all py-1 pr-4 text-text-muted">{show(row.before?.[k])}</td>
                <td className="break-all py-1 text-text">{show(row.after?.[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-text-muted">No field-level changes recorded for this action.</p>
      )}
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
        {row.entityType ? (
          <>
            <dt className="text-text-muted">Record</dt>
            <dd className="font-mono text-text">
              {row.entityType} {row.entityId}
            </dd>
          </>
        ) : null}
        {row.path ? (
          <>
            <dt className="text-text-muted">Request</dt>
            <dd className="break-all font-mono text-text">
              {row.method} {row.path} → {row.statusCode ?? "—"}
            </dd>
          </>
        ) : null}
        {"body" in meta ? (
          <>
            <dt className="text-text-muted">Sent</dt>
            <dd className="break-all font-mono text-text">{JSON.stringify(meta.body)}</dd>
          </>
        ) : null}
        {row.userAgent ? (
          <>
            <dt className="text-text-muted">Device</dt>
            <dd className="break-all text-text-muted">{row.userAgent}</dd>
          </>
        ) : null}
      </dl>
    </div>
  );
}

/** Audit log table. `groupId` = a group's own log (leaders); null = platform-wide (super admin). */
export function AuditLog({ groupId, platformGroupFilter }: { groupId: string | null; platformGroupFilter?: string }) {
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const q = useDeferredValue(search);
  const filter: AuditFilter = {
    search: q || undefined,
    action: action === "all" ? undefined : action,
    from: from || undefined,
    to: to || undefined,
    groupId: groupId ? undefined : platformGroupFilter,
    page,
    pageSize: 50,
  };
  const log = useAuditQuery(groupId, filter);
  const actions = useAuditActionsQuery(!groupId);
  const reset = () => setPage(1);

  const download = async () => {
    setDownloading(true);
    try {
      const { page: _p, pageSize: _s, ...rest } = filter;
      void _p;
      void _s;
      await downloadReport(auditPath(groupId, rest), "csv");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            reset();
          }}
          placeholder="Person, action, record id or IP"
        />
        <div className="space-y-1">
          <Label className="text-xs text-text-muted">What</Label>
          <Select
            value={action}
            onValueChange={(v) => {
              setAction(v);
              reset();
            }}
          >
            <SelectTrigger className="h-9 w-52 border-border bg-bg">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everything</SelectItem>
              {FAMILIES.map(([v, l]) => (
                <SelectItem key={v} value={v}>
                  {l}
                </SelectItem>
              ))}
              {(actions.data ?? []).map((a) => (
                <SelectItem key={`a-${a.action}`} value={a.action}>
                  {a.action} ({a.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="al-from" className="text-xs text-text-muted">From</Label>
          <Input id="al-from" type="date" value={from} onChange={(e) => (setFrom(e.target.value), reset())} className="h-9 w-40 border-border bg-bg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="al-to" className="text-xs text-text-muted">To</Label>
          <Input id="al-to" type="date" value={to} onChange={(e) => (setTo(e.target.value), reset())} className="h-9 w-40 border-border bg-bg" />
        </div>
        <Button variant="outline" size="sm" className="h-9" disabled={downloading} onClick={() => void download()}>
          {downloading ? <Loader2 className="animate-spin" /> : <Download />} CSV
        </Button>
      </div>

      {log.isLoading ? (
        <Loading />
      ) : log.isError ? (
        <p className="text-sm text-destructive">{log.error.message}</p>
      ) : (
        <>
          <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
            <table className="w-full min-w-200 text-sm">
              <thead className="bg-secondary/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="w-6 px-2 py-2" />
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Action</th>
                  <th className="px-3 py-2 font-medium">Who</th>
                  {!groupId ? <th className="px-3 py-2 font-medium">Group</th> : null}
                  <th className="px-3 py-2 font-medium">IP</th>
                </tr>
              </thead>
              <tbody>
                {log.data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-text-muted">
                      Nothing recorded for these filters.
                    </td>
                  </tr>
                ) : (
                  log.data?.items.map((r) => {
                    const isOpen = open === r.id;
                    const failed = (r.statusCode ?? 200) >= 400 || r.action.endsWith("_failed") || r.action.endsWith(".denied");
                    return (
                      <Fragment key={r.id}>
                        <tr className="cursor-pointer border-t border-border hover:bg-secondary/30" onClick={() => setOpen(isOpen ? null : r.id)}>
                          <td className="px-2 py-2 text-text-muted">{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</td>
                          <td className="whitespace-nowrap px-3 py-2 text-text-muted">{fmtDateTime(r.createdAt)}</td>
                          <td className="px-3 py-2">
                            <span className="font-mono text-xs text-text">{r.action}</span>
                            {failed ? (
                              <span className="ml-2">
                                <StatusPill tone="critical">refused</StatusPill>
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-text">
                            {r.actorName ?? (r.actorId ? r.actorId.slice(0, 8) : "System")}
                            {r.impersonatorId ? <span className="block text-xs text-text-muted">support session</span> : null}
                          </td>
                          {!groupId ? <td className="px-3 py-2 text-text-muted">{r.groupName ?? "—"}</td> : null}
                          <td className="px-3 py-2 font-mono text-xs text-text-muted">{r.ip ?? "—"}</td>
                        </tr>
                        {isOpen ? (
                          <tr className="border-t border-border">
                            <td colSpan={6} className="p-0">
                              <Changes row={r} />
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {log.data ? <Pager page={page} totalPages={log.data.totalPages} total={log.data.total} onPage={setPage} busy={log.isFetching} /> : null}
        </>
      )}
    </div>
  );
}
