# Auth screens: warm botanical redesign

Copy these files over the same paths in `e-kimina-fn`. No new dependencies, no config or CSS changes.

| File | Change |
|---|---|
| `components/auth/auth-shell.tsx` | Rewritten to the new design. Same exports and props, so every auth page works unchanged. |
| `components/auth/login-art.tsx` | Rewritten: `DesktopArt` (photo in a large oval + orange crescent, leaves, line waves) and `MobileArt` (curved photo header, leaves top and bottom, corner waves). Uses the existing `public/images/login-landscape.webp` and `login-leaves.webp`. |
| `components/auth/auth-fonts.ts` | New. Fraunces (headings, code boxes) and Jost (body) via `next/font`, applied only inside `AuthShell`. |
| `app/(auth)/login/page.tsx` | Class names only: sizes of the two-step hint, link row, "Remember me" row and checkbox. |
| `app/(auth)/register/page.tsx` | Class names only: first/last name side by side from `lg` (was `sm`). |

Design notes
- Colours reuse the warm palette already in `app/globals.css` (`clay`, `clay-deep`, `clay-soft`, `cream`, `sand`, `sand-line`, `ink-brown`, `bark`).
- Corner radii are fixed pixel values (6–10px) so they don't follow the app-wide `--radius` scale.
- The page is now full-bleed instead of a floating card; the oval photo sits on the left from `lg` (1024px) up.
- The step dots and the three-line divider are gone; `steps` / `step` are announced to screen readers instead.
- Images use `fetchPriority="high"` (Next 16 deprecates `priority`).

Checked: `tsc --noEmit` clean, `eslint` 0 errors (2 existing state-in-effect warnings in the pages' logic), `pnpm test` 24/24 passing, Tailwind compiles every new class.
