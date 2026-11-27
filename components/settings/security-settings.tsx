"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Laptop, Loader2, LogOut, ShieldCheck, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  changePassword,
  confirmSmsTwoFactor,
  disableTwoFactor,
  enableTotp,
  fetchSecurity,
  fetchSessions,
  newRecoveryCodes,
  revokeSession,
  startSmsTwoFactor,
  startTotp,
} from "@/lib/api/account-api";
import { logoutEverywhere } from "@/lib/api/auth-api";
import { tokenStorage } from "@/lib/api/api-client";

const when = (s: string | null) =>
  s ? new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

function device(ua: string | null) {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return /node|curl|undici/i.test(ua) ? "API client" : `${browser}${os ? ` on ${os}` : ""}`;
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-(--radius) border border-border bg-bg p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
        {icon} {title}
      </h3>
      {children}
    </section>
  );
}

function RecoveryCodes({ codes, onClose }: { codes: string[] | null; onClose: () => void }) {
  return (
    <Dialog open={Boolean(codes)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-bg">
        <DialogHeader>
          <DialogTitle>Save your recovery codes</DialogTitle>
          <DialogDescription>
            Each code works once if you lose your phone. They will not be shown again — keep them somewhere safe.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 rounded-md border border-border bg-secondary/40 p-3 font-mono text-sm text-text">
          {codes?.map((c) => <span key={c}>{c}</span>)}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => void navigator.clipboard.writeText(codes?.join("\n") ?? "").then(() => toast.success("Copied."))}
          >
            <Copy /> Copy
          </Button>
          <Button onClick={onClose}>I saved them</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TwoStep() {
  const qc = useQueryClient();
  const sec = useQuery({ queryKey: ["security"], queryFn: fetchSecurity });
  const [setup, setSetup] = useState<null | { kind: "TOTP"; secret: string; url: string } | { kind: "SMS" }>(null);
  const [code, setCode] = useState("");
  const [codes, setCodes] = useState<string[] | null>(null);
  const [pwFor, setPwFor] = useState<null | "disable" | "codes">(null);
  const [pw, setPw] = useState("");
  const refresh = () => void qc.invalidateQueries({ queryKey: ["security"] });
  const act = useMutation({
    mutationFn: async (fn: () => Promise<void>) => fn(),
    onError: (e: Error) => toast.error(e.message),
  });

  if (sec.isLoading) return <Loader2 className="size-4 animate-spin text-text-muted" />;
  if (!sec.data) return <p className="text-sm text-destructive">{sec.error?.message}</p>;
  const s = sec.data;

  return (
    <Card title="Two-step verification" icon={<ShieldCheck className="size-4" />}>
      {s.twoFactor.required && !s.twoFactor.method ? (
        <p className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-text">
          As a group admin or treasurer you must turn this on before you can approve or move money.
        </p>
      ) : null}
      {s.twoFactor.method ? (
        <>
          <p className="text-sm text-text">
            On, using {s.twoFactor.method === "TOTP" ? "an authenticator app" : `SMS to ${s.phone.number}`} since {when(s.twoFactor.enabledAt)}.
            <span className="text-text-muted"> {s.twoFactor.recoveryCodesLeft} recovery codes left.</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => setPwFor("codes")}>
              New recovery codes
            </Button>
            {!s.twoFactor.required ? (
              <Button size="sm" variant="outline" onClick={() => setPwFor("disable")}>
                Turn off
              </Button>
            ) : null}
          </div>
        </>
      ) : setup ? (
        <div className="space-y-3">
          {setup.kind === "TOTP" ? (
            <>
              <p className="text-sm text-text">
                In Google Authenticator, Microsoft Authenticator or a similar app, add an account with this key (or open the link on
                your phone):
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded-md border border-border bg-secondary/40 px-3 py-2 font-mono text-sm tracking-wider text-text">
                  {setup.secret.match(/.{1,4}/g)?.join(" ")}
                </code>
                <Button size="sm" variant="outline" onClick={() => void navigator.clipboard.writeText(setup.secret).then(() => toast.success("Key copied."))}>
                  <Copy /> Copy key
                </Button>
                <a href={setup.url} className="text-sm text-primary underline underline-offset-2">
                  Open in authenticator app
                </a>
              </div>
            </>
          ) : (
            <p className="text-sm text-text">We texted a code to {s.phone.number}.</p>
          )}
          <div className="flex max-w-sm items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor="tfa-code" className="text-xs">6-digit code</Label>
              <Input id="tfa-code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} className="border-border bg-bg" />
            </div>
            <Button
              disabled={act.isPending || code.trim().length < 6}
              onClick={() =>
                act.mutate(async () => {
                  const r = setup.kind === "TOTP" ? await enableTotp(code) : await confirmSmsTwoFactor(code);
                  setCodes(r.recoveryCodes);
                  setSetup(null);
                  setCode("");
                  refresh();
                })
              }
            >
              Turn on
            </Button>
          </div>
          <button type="button" className="text-xs text-text-muted hover:text-text" onClick={() => setSetup(null)}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-muted">After your password, also ask for a code from your phone when you sign in.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={act.isPending}
              onClick={() =>
                act.mutate(async () => {
                  const r = await startTotp();
                  setSetup({ kind: "TOTP", secret: r.secret, url: r.otpauthUrl });
                })
              }
            >
              <KeyRound /> Use an authenticator app
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={act.isPending || !s.phone.verified}
              title={s.phone.verified ? undefined : "Verify your phone number in Profile first"}
              onClick={() =>
                act.mutate(async () => {
                  await startSmsTwoFactor();
                  setSetup({ kind: "SMS" });
                })
              }
            >
              <Smartphone /> Use SMS
            </Button>
          </div>
          {!s.phone.verified ? <p className="text-xs text-text-muted">SMS needs a verified phone number (Profile).</p> : null}
        </>
      )}

      <RecoveryCodes codes={codes} onClose={() => setCodes(null)} />

      <Dialog open={Boolean(pwFor)} onOpenChange={(o) => !o && (setPwFor(null), setPw(""))}>
        <DialogContent className="bg-bg">
          <DialogHeader>
            <DialogTitle>{pwFor === "disable" ? "Turn off two-step verification?" : "Make new recovery codes?"}</DialogTitle>
            <DialogDescription>
              {pwFor === "disable" ? "Your account will be protected by your password only." : "Your old recovery codes stop working."} Enter your
              password to continue.
            </DialogDescription>
          </DialogHeader>
          <Input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="border-border bg-bg" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwFor(null)}>
              Cancel
            </Button>
            <Button
              disabled={!pw || act.isPending}
              onClick={() =>
                act.mutate(async () => {
                  if (pwFor === "disable") {
                    await disableTwoFactor(pw);
                    toast.success("Two-step verification is off.");
                  } else {
                    setCodes((await newRecoveryCodes(pw)).recoveryCodes);
                  }
                  setPwFor(null);
                  setPw("");
                  refresh();
                })
              }
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PasswordCard() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: () => changePassword(cur, next),
    onSuccess: () => {
      toast.success("Password changed. Other devices were signed out.");
      setCur("");
      setNext("");
      setAgain("");
      void qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const bad = next.length > 0 && next.length < 8 ? "At least 8 characters." : again && again !== next ? "The passwords do not match." : null;
  return (
    <Card title="Password" icon={<KeyRound className="size-4" />}>
      <div className="grid max-w-xl gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="pw-cur" className="text-xs">Current</Label>
          <Input id="pw-cur" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} className="border-border bg-bg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pw-new" className="text-xs">New</Label>
          <Input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className="border-border bg-bg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pw-again" className="text-xs">New, again</Label>
          <Input id="pw-again" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} className="border-border bg-bg" />
        </div>
      </div>
      {bad ? <p className="text-xs text-destructive">{bad}</p> : null}
      <Button size="sm" disabled={!cur || next.length < 8 || next !== again || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? <Loader2 className="animate-spin" /> : null} Change password
      </Button>
    </Card>
  );
}

function Sessions() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["sessions"], queryFn: fetchSessions });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeSession(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["sessions"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const all = useMutation({
    mutationFn: logoutEverywhere,
    onSuccess: () => {
      tokenStorage.remove();
      qc.clear();
      window.location.assign("/login");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Card title="Where you are signed in" icon={<Laptop className="size-4" />}>
      {list.isLoading ? (
        <Loader2 className="size-4 animate-spin text-text-muted" />
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {(list.data ?? []).map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="text-text">
                  {device(s.userAgent)}
                  {s.current ? <span className="ml-2 text-xs text-primary">this device</span> : null}
                </p>
                <p className="text-xs text-text-muted">
                  Signed in {when(s.signedInAt)} · last active {when(s.lastActiveAt)}
                  {s.ip ? ` · ${s.ip}` : ""}
                </p>
              </div>
              {!s.current ? (
                <Button size="sm" variant="ghost" disabled={revoke.isPending} onClick={() => revoke.mutate(s.id)}>
                  Sign out
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="outline" disabled={all.isPending} onClick={() => all.mutate()}>
        <LogOut /> Sign out everywhere
      </Button>
    </Card>
  );
}

export function SecuritySettings() {
  return (
    <div className="space-y-5">
      <PasswordCard />
      <TwoStep />
      <Sessions />
    </div>
  );
}
