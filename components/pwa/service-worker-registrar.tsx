"use client";

import { useEffect } from "react";

/**
 * Registers `/sw.js` (offline pages + web push) in production builds. In development the
 * worker would cache stale bundles, so it is only registered by the push settings screen.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined);
  }, []);
  return null;
}
