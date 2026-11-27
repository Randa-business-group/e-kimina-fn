"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Camera, Download, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  cancelDeletion,
  downloadMyData,
  fetchDeletion,
  requestDeletion,
  sendPhoneCode,
  updateProfile,
  verifyPhone,
} from "@/lib/api/account-api";
import { uploadFile } from "@/lib/api/upload-api";
import { useAuth } from "@/lib/auth/auth-context";
import { authKeys } from "@/lib/auth/auth-keys";
import type { UserResponse } from "@/types/auth";

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-(--radius) border border-border bg-bg p-4">
      <h2 className="text-sm font-semibold text-text">{title}</h2>
      {children}
    </section>
  );
}

function ProfileForm({ user }: { user: UserResponse }) {
  const qc = useQueryClient();
  const [name, setName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phoneNumber ?? "");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const setUser = (u: UserResponse) => qc.setQueryData(authKeys.profile(), u);

  const save = useMutation({
    mutationFn: () => updateProfile({ fullName: name.trim(), phoneNumber: phone.trim() ? phone.trim() : null }),
    onSuccess: (u) => {
      setUser(u);
      setPhone(u.phoneNumber ?? "");
      toast.success("Profile saved.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const photo = useMutation({
    mutationFn: async (f: File) => updateProfile({ image: await uploadFile(f) }),
    onSuccess: (u) => {
      setUser(u);
      toast.success("Photo updated.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const removePhoto = useMutation({
    mutationFn: () => updateProfile({ image: null }),
    onSuccess: setUser,
    onError: (e: Error) => toast.error(e.message),
  });
  const send = useMutation({
    mutationFn: sendPhoneCode,
    onSuccess: (r) => {
      setCodeSent(r.sent);
      toast.success(r.message);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const verify = useMutation({
    mutationFn: () => verifyPhone(code.trim()),
    onSuccess: (u) => {
      setUser(u);
      setCodeSent(false);
      setCode("");
      toast.success("Phone number verified.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const dirty = name.trim() !== user.fullName || (phone.trim() || null) !== (user.phoneNumber ?? null);

  return (
    <Card title="Your details">
      <div className="flex items-center gap-4">
        <Avatar src={user.image ?? undefined} fallback={user.fullName} alt={user.fullName} size="lg" />
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) photo.mutate(f);
              e.target.value = "";
            }}
          />
          <Button size="sm" variant="outline" disabled={photo.isPending} onClick={() => fileRef.current?.click()}>
            {photo.isPending ? <Loader2 className="animate-spin" /> : <Camera />} Change photo
          </Button>
          {user.image ? (
            <Button size="sm" variant="ghost" disabled={removePhoto.isPending} onClick={() => removePhoto.mutate()}>
              Remove
            </Button>
          ) : null}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="pf-name" className="text-xs">Full name</Label>
          <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} className="border-border bg-bg" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-email" className="text-xs">Email</Label>
          <Input id="pf-email" value={user.email} disabled className="border-border bg-secondary/40" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="pf-phone" className="text-xs">Phone number (SMS and phone sign-in)</Label>
          <Input id="pf-phone" type="tel" placeholder="0788123456" value={phone} onChange={(e) => setPhone(e.target.value)} className="border-border bg-bg" />
          {user.phoneNumber && !dirty ? (
            user.phoneVerifiedAt ? (
              <p className="flex items-center gap-1 text-xs text-text-muted">
                <BadgeCheck className="size-3.5 text-primary" /> Verified
              </p>
            ) : codeSent ? (
              <div className="flex items-end gap-2 pt-1">
                <Input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="h-8 border-border bg-bg"
                />
                <Button size="sm" disabled={code.trim().length < 6 || verify.isPending} onClick={() => verify.mutate()}>
                  Verify
                </Button>
              </div>
            ) : (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:text-primary/80"
                disabled={send.isPending}
                onClick={() => send.mutate()}
              >
                Not verified: send me a code
              </button>
            )
          ) : null}
        </div>
      </div>
      <Button disabled={!dirty || name.trim().length < 2 || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? <Loader2 className="animate-spin" /> : null} Save
      </Button>
    </Card>
  );
}

function Privacy() {
  const qc = useQueryClient();
  const del = useQuery({ queryKey: ["deletion"], queryFn: fetchDeletion });
  const [reason, setReason] = useState("");
  const [downloading, setDownloading] = useState(false);
  const ask = useMutation({
    mutationFn: () => requestDeletion(reason.trim()),
    onSuccess: () => {
      toast.success("Request sent. We answer within 30 days.");
      void qc.invalidateQueries({ queryKey: ["deletion"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cancel = useMutation({
    mutationFn: cancelDeletion,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["deletion"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const r = del.data?.request;
  const pending = r?.status === "PENDING";

  return (
    <Card title="Your data">
      <div className="space-y-2">
        <p className="text-sm text-text-muted">
          Download a copy of everything E-kimina holds about you: profile, groups, contributions, payments, loans, fines, messages and
          sign-in history (Rwanda Law No. 058/2021).
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={downloading}
          onClick={() => {
            setDownloading(true);
            void downloadMyData()
              .catch((e: Error) => toast.error(e.message))
              .finally(() => setDownloading(false));
          }}
        >
          {downloading ? <Loader2 className="animate-spin" /> : <Download />} Download my data
        </Button>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <h3 className="text-sm font-medium text-text">Delete my account</h3>
        {pending && r ? (
          <>
            <p className="text-sm text-text">
              You asked on {new Date(r.requestedAt).toLocaleDateString("en-GB")}. A platform administrator will handle it within 30 days.
            </p>
            {del.data?.blockers.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-text-muted">
                {del.data.blockers.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            ) : null}
            <Button size="sm" variant="outline" disabled={cancel.isPending} onClick={() => cancel.mutate()}>
              Cancel my request
            </Button>
          </>
        ) : (
          <>
            {r?.status === "REJECTED" ? <p className="text-sm text-text">Your last request was declined: {r.decisionNote}</p> : null}
            <p className="text-sm text-text-muted">
              Your name, email, phone and photo are removed. Group records of past contributions and loans are kept without your name, as
              the law requires. Leave your groups and repay any loan first.
            </p>
            <Textarea
              placeholder="Why are you leaving? (optional)"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="max-w-xl border-border bg-bg"
            />
            <Button size="sm" variant="destructive" disabled={ask.isPending} onClick={() => ask.mutate()}>
              <Trash2 /> Request deletion
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

export function ProfilePage() {
  const { user } = useAuth();
  return (
    <main className="pb-5 lg:pt-2">
      <div className="container mx-auto max-w-3xl space-y-4 px-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.01em] text-text sm:text-[34px]">My profile</h1>
          <p className="mt-1 text-sm text-text-muted">Your details, phone verification and your data.</p>
        </div>
        {user ? <ProfileForm key={user.updatedAt + (user.phoneNumber ?? "")} user={user} /> : <Loader2 className="size-4 animate-spin" />}
        <Privacy />
      </div>
    </main>
  );
}
