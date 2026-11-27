"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  deletePushSubscription,
  fetchPreferences,
  fetchPushKey,
  resetPreferences,
  savePreferences,
  savePushSubscription,
  sendTestPush,
  urlBase64ToUint8Array,
} from "@/lib/api/communication-api";
import type { Channel, NotificationPreferences } from "@/types/communication";

const CHANNELS: { key: Channel; label: string }[] = [
  { key: "IN_APP", label: "In the app" },
  { key: "EMAIL", label: "Email" },
  { key: "SMS", label: "SMS" },
  { key: "PUSH", label: "Browser" },
];

const PREFS_KEY = ["notification-preferences"] as const;

type PushState = "unsupported" | "denied" | "off" | "on" | "loading";

function usePushDevice() {
  const [state, setState] = useState<PushState>("loading");
  const [sub, setSub] = useState<PushSubscription | null>(null);
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        if (!cancelled) setState("unsupported");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
      const s = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setSub(s);
      setState(Notification.permission === "denied" ? "denied" : s ? "on" : "off");
    };
    run().catch(() => !cancelled && setState("unsupported"));
    return () => {
      cancelled = true;
    };
  }, []);
  return { state, setState, sub, setSub };
}

function PushCard({ onChange }: { onChange: () => void }) {
  const { state, setState, sub, setSub } = usePushDevice();
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setState(perm === "denied" ? "denied" : "off");
        return;
      }
      const { publicKey } = await fetchPushKey();
      const reg = await navigator.serviceWorker.ready;
      const s = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await savePushSubscription(s.toJSON());
      setSub(s);
      setState("on");
      toast.success("Browser notifications are on for this device.");
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not turn on browser notifications.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const endpoint = sub?.endpoint;
      await sub?.unsubscribe();
      await deletePushSubscription(endpoint);
      setSub(null);
      setState("off");
      onChange();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not turn off browser notifications.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-(--radius) border border-border bg-bg p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <BellRing className="size-4" /> Browser notifications on this device
        </h3>
        <p className="mt-1 text-xs text-text-muted">
          {state === "unsupported"
            ? "This browser does not support push notifications."
            : state === "denied"
              ? "Notifications are blocked for this site in your browser settings."
              : state === "on"
                ? "This device gets alerts even when E-kimina is closed."
                : "Get alerts on this device even when E-kimina is closed."}
        </p>
      </div>
      <div className="flex gap-2">
        {state === "on" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() =>
                void sendTestPush()
                  .then((r) => (r.sent ? toast.success("Test sent.") : toast.error("No device accepted the test.")))
                  .catch((e: Error) => toast.error(e.message))
              }
            >
              Send test
            </Button>
            <Button variant="outline" size="sm" disabled={busy} onClick={() => void disable()}>
              Turn off
            </Button>
          </>
        ) : state === "off" ? (
          <Button size="sm" disabled={busy} onClick={() => void enable()}>
            {busy ? <Loader2 className="animate-spin" /> : null} Turn on
          </Button>
        ) : state === "loading" ? (
          <Loader2 className="size-4 animate-spin text-text-muted" />
        ) : null}
      </div>
    </section>
  );
}

export function NotificationSettings() {
  const qc = useQueryClient();
  const prefs = useQuery({ queryKey: PREFS_KEY, queryFn: fetchPreferences });
  const set = (d: NotificationPreferences) => qc.setQueryData(PREFS_KEY, d);
  const save = useMutation({
    mutationFn: (p: { category: string; channel: Channel; enabled: boolean }) => savePreferences([p]),
    onSuccess: set,
    onError: (e: Error) => toast.error(e.message),
  });
  const reset = useMutation({
    mutationFn: resetPreferences,
    onSuccess: (d) => {
      set(d);
      toast.success("Back to the default settings.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (prefs.isLoading)
    return (
      <p className="flex items-center gap-2 text-sm text-text-muted">
        <Loader2 className="size-4 animate-spin" /> Loading…
      </p>
    );
  if (prefs.isError || !prefs.data) return <p className="text-sm text-destructive">{prefs.error?.message}</p>;
  const d = prefs.data;

  return (
    <div className="space-y-5">
      <PushCard onChange={() => void qc.invalidateQueries({ queryKey: PREFS_KEY })} />

      <section className="rounded-(--radius) border border-border bg-bg">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <div>
            <h3 className="text-sm font-semibold text-text">What you hear about, and where</h3>
            <p className="mt-1 text-xs text-text-muted">
              Email to {d.channels.EMAIL.address}
              {d.channels.SMS.phone ? ` · SMS to ${d.channels.SMS.phone}` : ""}
            </p>
          </div>
          <Button variant="ghost" size="sm" disabled={reset.isPending} onClick={() => reset.mutate()}>
            <RotateCcw /> Defaults
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-140 text-sm">
            <thead>
              <tr className="text-left text-xs text-text-muted">
                <th className="px-4 py-2 font-medium">Topic</th>
                {CHANNELS.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-center font-medium">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.categories.map((cat) => (
                <tr key={cat.key} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{cat.label}</p>
                    <p className="text-xs text-text-muted">{cat.description}</p>
                  </td>
                  {CHANNELS.map((c) => {
                    const ch = d.channels[c.key];
                    const s = cat.settings[c.key];
                    return (
                      <td key={c.key} className="px-3 py-3 text-center">
                        <Switch
                          checked={s.enabled}
                          disabled={save.isPending}
                          aria-label={`${cat.label} by ${c.label}`}
                          title={ch.available ? undefined : (ch.reason ?? undefined)}
                          onCheckedChange={(v) => save.mutate({ category: cat.key, channel: c.key, enabled: v })}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="space-y-1 border-t border-border p-4 text-xs text-text-muted">
          {CHANNELS.filter((c) => !d.channels[c.key].available && d.channels[c.key].reason).map((c) => (
            <li key={c.key}>
              {c.label}: {d.channels[c.key].reason}
            </li>
          ))}
          <li>Removal and suspension notices always appear in the app.</li>
        </ul>
      </section>
    </div>
  );
}
