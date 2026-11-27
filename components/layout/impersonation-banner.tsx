"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import { IMPERSONATION_EVENT, endImpersonation, getImpersonation } from "@/lib/api/admin-api";

function subscribe(cb: () => void) {
  window.addEventListener(IMPERSONATION_EVENT, cb);
  return () => window.removeEventListener(IMPERSONATION_EVENT, cb);
}

/** Shown while a super admin uses a read-only support session (msfts §6). */
export function ImpersonationBanner() {
  const info = useSyncExternalStore(subscribe, getImpersonation, () => null);
  const qc = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (!info) return;
    const exit = () => {
      void endImpersonation().then(() => {
        qc.clear();
        router.push("/dashboard/users");
      });
    };
    const t = window.setTimeout(exit, Math.max(0, new Date(info.expiresAt).getTime() - Date.now()));
    return () => window.clearTimeout(t);
  }, [info, qc, router]);

  if (!info) return null;
  const until = new Date(info.expiresAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2 text-sm text-text"
      style={{ background: "color-mix(in srgb, var(--status-warning) 18%, var(--color-bg))" }}
    >
      <span className="flex items-center gap-2">
        <Eye className="size-4" aria-hidden />
        Read-only support view as <strong>{info.name}</strong> ({info.email}) · ends {until}
      </span>
      <button
        type="button"
        className="rounded-md border border-border bg-bg px-3 py-1 text-xs font-medium hover:bg-secondary"
        onClick={() =>
          void endImpersonation().then(() => {
            qc.clear();
            router.push("/dashboard/users");
          })
        }
      >
        Exit support view
      </button>
    </div>
  );
}
