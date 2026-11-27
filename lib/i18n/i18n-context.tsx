"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Locale, MessageKey } from "./dictionaries";
import { formatDate, formatDateTime, formatMoney, formatNumber, pickLocale, translate } from "./format";

const STORAGE_KEY = "ek_locale";

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: MessageKey | string, vars?: Record<string, string | number>) => string;
  money: (amount: number, currency?: string) => string;
  number: (n: number, maxDecimals?: number) => string;
  date: (d: string | number | Date | null | undefined) => string;
  dateTime: (d: string | number | Date | null | undefined) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    /* storage blocked */
  }
  return pickLocale(stored, navigator.languages ?? [navigator.language]);
}

/** Language and locale-aware formatting for the whole app (msfts §9). */
export function I18nProvider({ children }: { children: ReactNode }) {
  // English on the server and first paint, then the visitor's choice (avoids hydration mismatch).
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const l = initialLocale();
    if (l !== "en") queueMicrotask(() => setLocaleState(l));
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* storage blocked */
    }
    document.cookie = `${STORAGE_KEY}=${l}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      t: (key, vars) => translate(locale, key, vars),
      money: (a, c) => formatMoney(locale, a, c),
      number: (n, m) => formatNumber(locale, n, m),
      date: (d) => formatDate(locale, d),
      dateTime: (d) => formatDateTime(locale, d),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export const useT = () => useI18n().t;
