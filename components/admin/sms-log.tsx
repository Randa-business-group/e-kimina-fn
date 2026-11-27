"use client";

import { useDeferredValue, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchSmsLogs } from "@/lib/api/communication-api";
import { FilterChips, Loading, Pager, SearchBox, StatusPill, fmtDateTime } from "./admin-ui";

type Status = "" | "SENT" | "FAILED" | "SKIPPED";

/** Every SMS attempt (codes are stored masked). */
export function SmsLog() {
  const [status, setStatus] = useState<Status>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDeferredValue(search);
  const f = { status: status || undefined, search: q || undefined, page, pageSize: 50 };
  const logs = useQuery({ queryKey: ["admin", "sms", f], queryFn: () => fetchSmsLogs(f), placeholderData: keepPreviousData });
  const d = logs.data;
  return (
    <div className="space-y-4">
      {d ? (
        <p className="text-sm text-text-muted">
          Provider <span className="font-medium text-text">{d.provider}</span> · last 30 days: {d.last30Days.SENT ?? 0} sent (
          {d.last30Days.segments} segments), {d.last30Days.FAILED ?? 0} failed, {d.last30Days.SKIPPED ?? 0} skipped
        </p>
      ) : null}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips<Status>
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "", label: "All" },
            { value: "SENT", label: "Sent" },
            { value: "FAILED", label: "Failed" },
            { value: "SKIPPED", label: "Skipped" },
          ]}
        />
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Phone number or text"
        />
      </div>
      {logs.isLoading ? (
        <Loading />
      ) : logs.isError ? (
        <p className="text-sm text-destructive">{logs.error.message}</p>
      ) : (
        <>
          <div className="overflow-auto rounded-(--radius) border border-border bg-bg">
            <table className="w-full min-w-180 text-sm">
              <thead className="bg-secondary/60 text-left text-xs text-text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">To</th>
                  <th className="px-3 py-2 font-medium">Kind</th>
                  <th className="px-3 py-2 font-medium">Message</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {d?.items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-text-muted">
                      No SMS yet.
                    </td>
                  </tr>
                ) : (
                  d?.items.map((r) => (
                    <tr key={r.id} className="border-t border-border align-top">
                      <td className="whitespace-nowrap px-3 py-2 text-text-muted">{fmtDateTime(r.createdAt)}</td>
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-text">+{r.to}</td>
                      <td className="px-3 py-2 font-mono text-xs text-text">{r.kind}</td>
                      <td className="px-3 py-2 text-text">
                        {r.message}
                        {r.segments > 1 ? <span className="ml-1 text-xs text-text-muted">({r.segments} parts)</span> : null}
                      </td>
                      <td className="px-3 py-2">
                        <StatusPill tone={r.status === "SENT" ? "good" : r.status === "FAILED" ? "critical" : "neutral"}>
                          {r.status.toLowerCase()}
                        </StatusPill>
                        {r.error ? <p className="mt-1 text-xs text-text-muted">{r.error}</p> : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {d ? <Pager page={page} totalPages={d.totalPages} total={d.total} onPage={setPage} busy={logs.isFetching} /> : null}
        </>
      )}
    </div>
  );
}
