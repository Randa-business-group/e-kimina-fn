"use client";

import { WifiOff } from "lucide-react";
import { useT } from "@/lib/i18n/i18n-context";

/** Shown by the service worker when a page is requested without a connection. */
export default function OfflinePage() {
  const t = useT();
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm space-y-4 text-center">
        <WifiOff className="mx-auto size-10 text-text-muted" aria-hidden />
        <h1 className="text-xl font-semibold text-text">{t("offline.title")}</h1>
        <p className="text-sm text-text-muted">{t("offline.body")}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-text px-4 py-2 text-sm font-semibold text-bg hover:opacity-90"
        >
          {t("offline.retry")}
        </button>
      </div>
    </main>
  );
}
