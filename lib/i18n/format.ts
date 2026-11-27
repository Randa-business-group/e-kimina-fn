import { DICTS, INTL_TAG, en, type Locale, type MessageKey } from "./dictionaries";

/** Translate a key (falls back to English, then to the key) and fill `{placeholders}`. */
export function translate(locale: Locale, key: MessageKey | string, vars?: Record<string, string | number>): string {
  const dict = DICTS[locale] as Record<string, string | undefined>;
  const base = en as Record<string, string>;
  let s = dict[key] ?? base[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

const cache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();
function nf(tag: string, opts: Intl.NumberFormatOptions) {
  const k = `n|${tag}|${JSON.stringify(opts)}`;
  let f = cache.get(k) as Intl.NumberFormat | undefined;
  if (!f) {
    try {
      f = new Intl.NumberFormat(tag, opts);
    } catch {
      f = new Intl.NumberFormat("en", opts);
    }
    cache.set(k, f);
  }
  return f;
}
function df(tag: string, opts: Intl.DateTimeFormatOptions) {
  const k = `d|${tag}|${JSON.stringify(opts)}`;
  let f = cache.get(k) as Intl.DateTimeFormat | undefined;
  if (!f) {
    try {
      f = new Intl.DateTimeFormat(tag, opts);
    } catch {
      f = new Intl.DateTimeFormat("en", opts);
    }
    cache.set(k, f);
  }
  return f;
}

/** "12,500 RWF" (no decimals for RWF; currency code after the number, as used in Rwanda). */
export function formatMoney(locale: Locale, amount: number, currency = "RWF"): string {
  const decimals = currency === "RWF" ? 0 : 2;
  const n = nf(INTL_TAG[locale], { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(amount);
  return `${n} ${currency}`;
}

export function formatNumber(locale: Locale, n: number, maxDecimals = 2): string {
  return nf(INTL_TAG[locale], { maximumFractionDigits: maxDecimals }).format(n);
}

export function formatDate(locale: Locale, d: string | number | Date | null | undefined): string {
  if (d == null) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return df(INTL_TAG[locale], { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function formatDateTime(locale: Locale, d: string | number | Date | null | undefined): string {
  if (d == null) return "—";
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "—";
  return df(INTL_TAG[locale], { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

/** Pick a supported locale from a stored value or the browser's languages. */
export function pickLocale(stored: string | null | undefined, browser: readonly string[] = []): Locale {
  const ok = (v: string | null | undefined): v is Locale => v === "en" || v === "rw" || v === "fr";
  if (ok(stored)) return stored;
  for (const l of browser) {
    const base = l.toLowerCase().split("-")[0];
    if (ok(base)) return base;
  }
  return "en";
}
