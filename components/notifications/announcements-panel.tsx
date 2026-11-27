"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Megaphone, Pin, PinOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAnnouncement, deleteAnnouncement, fetchAnnouncements, pinAnnouncement } from "@/lib/api/communication-api";
import type { Channel } from "@/types/communication";

const when = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

/** Group announcements: everyone reads, the group admin posts (msfts §7). */
export function AnnouncementsPanel({ groupId, canPost }: { groupId: string; canPost: boolean }) {
  const qc = useQueryClient();
  const key = ["announcements", groupId] as const;
  const list = useQuery({ queryKey: key, queryFn: () => fetchAnnouncements(groupId) });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [extra, setExtra] = useState<Channel[]>([]);
  const [pinned, setPinned] = useState(false);
  const toggle = (c: Channel, on: boolean) => setExtra((x) => (on ? [...new Set([...x, c])] : x.filter((y) => y !== c)));
  const refresh = () => void qc.invalidateQueries({ queryKey: key });

  const post = useMutation({
    mutationFn: () => createAnnouncement(groupId, { title: title.trim(), body: body.trim(), channels: extra, pinned }),
    onSuccess: (a) => {
      toast.success(`Sent to ${a.recipients} member${a.recipients === 1 ? "" : "s"}.`);
      setTitle("");
      setBody("");
      setExtra([]);
      setPinned(false);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const pin = useMutation({
    mutationFn: (p: { id: string; pinned: boolean }) => pinAnnouncement(groupId, p.id, p.pinned),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteAnnouncement(groupId, id),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      {canPost ? (
        <section className="space-y-3 rounded-(--radius) border border-border bg-bg p-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Megaphone className="size-4" /> New announcement
          </h3>
          <div className="space-y-1">
            <Label htmlFor="ann-title" className="text-xs">Title</Label>
            <Input id="ann-title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className="border-border bg-bg" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ann-body" className="text-xs">Message</Label>
            <Textarea id="ann-body" value={body} maxLength={2000} rows={4} onChange={(e) => setBody(e.target.value)} className="border-border bg-bg" />
            <p className="text-right text-xs text-text-muted">{body.length}/2000</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-text">
            <span className="text-xs text-text-muted">Every member sees it in the app. Also send by:</span>
            {(["SMS", "EMAIL", "PUSH"] as Channel[]).map((c) => (
              <label key={c} className="flex items-center gap-2">
                <Checkbox checked={extra.includes(c)} onCheckedChange={(v) => toggle(c, v === true)} />
                {c === "SMS" ? "SMS" : c === "EMAIL" ? "Email" : "Browser push"}
              </label>
            ))}
            <label className="flex items-center gap-2">
              <Checkbox checked={pinned} onCheckedChange={(v) => setPinned(v === true)} /> Pin to top
            </label>
          </div>
          {extra.includes("SMS") ? (
            <p className="text-xs text-text-muted">SMS is cut to about 300 characters and limited to 3 announcements a day.</p>
          ) : null}
          <Button disabled={title.trim().length < 3 || body.trim().length < 3 || post.isPending} onClick={() => post.mutate()}>
            {post.isPending ? <Loader2 className="animate-spin" /> : <Megaphone />} Send to all members
          </Button>
        </section>
      ) : null}

      {list.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-text-muted">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </p>
      ) : list.isError ? (
        <p className="text-sm text-destructive">{list.error.message}</p>
      ) : !list.data?.length ? (
        <p className="text-sm text-text-muted">No announcements yet.</p>
      ) : (
        <ul className="space-y-3">
          {list.data.map((a) => (
            <li key={a.id} className="rounded-(--radius) border border-border bg-bg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium text-text">
                    {a.pinned ? <Pin className="size-3.5 text-primary" aria-label="Pinned" /> : null}
                    {a.title}
                  </p>
                  <p className="text-xs text-text-muted">
                    {a.authorName ?? "Group admin"} · {when(a.createdAt)}
                    {canPost ? ` · ${a.recipients} recipients${a.channels.length ? ` · also by ${a.channels.map((c) => c.toLowerCase()).join(", ")}` : ""}` : ""}
                  </p>
                </div>
                {canPost ? (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={a.pinned ? "Unpin" : "Pin"}
                      onClick={() => pin.mutate({ id: a.id, pinned: !a.pinned })}
                    >
                      {a.pinned ? <PinOff /> : <Pin />}
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Delete" onClick={() => del.mutate(a.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                ) : null}
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-text">{a.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
