# E-kimina — web app

Next.js 16 (App Router) front end for E-kimina, a platform for Rwandan savings groups (*ibimina*):
contributions, loans, fines, meetings, share-out and reports. It talks to the NestJS API in `../e-kimina-bn`.

## Run it

```bash
pnpm install          # dependencies are pnpm-managed
pnpm dev              # http://localhost:3033
pnpm build && pnpm start
pnpm lint
pnpm test             # unit tests (Node test runner, no extra packages)
node scripts/generate-icons.mjs   # regenerate the PWA icons
```

Environment:

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4033/api` | API base URL (must include `/api`) |

The API must list this app's origin in `CORS_ORIGINS` (it sends credentialed requests).

## How it is put together

- **Sessions** — the access token lives in memory only; the API sets a rotating refresh token in an
  httpOnly cookie. On load the app calls `/auth/refresh`; any 401 triggers one silent refresh
  (`lib/api/api-client.ts`). Nothing sensitive is stored in `localStorage`.
- **Route guards** — `proxy.ts` redirects before render using two non-sensitive hint cookies
  (`ek_session`, `ek_roles`) set by the app; `components/layout/route-guard.tsx` shows a "no access"
  screen on the client. Access rules live in `lib/navigation/route-access.ts`. The API remains the
  real authority.
- **Languages** — English, Kinyarwanda and French (`lib/i18n`). `useI18n()` gives `t()`, plus
  locale-aware `money()`, `date()` and `dateTime()`. Missing keys fall back to English. The language
  switch is in the top bar.
- **PWA** — `app/manifest.ts`, icons in `public/icons`, and `public/sw.js` (offline page, cached
  static assets, web push). API data is never cached. The worker registers in production builds.
- **Data** — TanStack Query hooks in `lib/query`, API calls in `lib/api`, response types in `types`.
- **Charts** — small dependency-free SVG charts in `components/charts`.

## Layout

```
app/(auth)        sign-in, sign-up, password reset, email verification
app/(dashboard)   the signed-in app (dashboard, groups, loans, deposits, reports, admin …)
app/offline       offline fallback page
components/       feature components (admin, dashboard, groups, reports, settings, ui …)
lib/              api clients, auth, i18n, navigation, query hooks
proxy.ts          route guard before render
tests/            unit tests (`pnpm test`)
```
