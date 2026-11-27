# E-kimina warm botanical redesign: auth, dashboard and all signed-in pages

Copy these files over the same paths in `e-kimina-fn` (two are new). No new packages.
This replaces all earlier zips: `components/auth/auth-fonts.ts` from that
package is no longer used, so delete it if you added it.

## Theme (affects every signed-in page)
- `app/globals.css`
  - Light and dark colour tokens switched to the warm palette: cream page, clay primary (#b5470f),
    ink-brown text, bark muted text, warm borders. Applies to both the app's own tokens
    (`bg-bg`, `text-text`, …) and the shadcn ones (`bg-primary`, `bg-card`, `border-border`, …).
  - Small corners: `--radius` is 0.5rem, so `rounded-(--radius)` / `rounded-lg` = 8px,
    `rounded-md` ≈ 6px, `rounded-sm` ≈ 5px across all pages.
  - Chart colours: series 1 clay, 2 leaf green, 3 amber (light and dark).
  - New `font-display` utility (Fraunces).
- `lib/fonts.ts` (new): Jost as the app sans (`--font-sans`, was Inter) and Fraunces for display.
- `app/layout.tsx`: loads those fonts; browser theme colour is clay.
- `app/manifest.ts`: PWA theme/background colours to match.

## Shell
- `components/layout/app-sidebar.tsx`: serif wordmark with a clay "E" tile, section labels with a rule,
  landscape art above the user card (always shown while the sidebar is expanded: 112px tall, 160px on
  windows at least 820px tall), card-style footer with just the user menu (Help stays in the System menu).
- `components/layout/sidebar-nav.tsx`: solid clay active item with white icon and text; `aria-current`.
- `components/layout/dashboard-top-bar.tsx`: spaced "WORKSPACE" label, bordered language and theme controls.
- `components/layout/notification-bell.tsx`, `user-menu.tsx`: matching bordered button, clay avatar.
- `components/layout/app-shell.tsx`: adds the decorative content art behind the pages.
- `components/layout/shell-art.tsx` (new): sidebar landscape, leaf branch and peach waves
  (uses the existing `public/images/login-*.webp`).

## Dashboard
- `app/(dashboard)/dashboard/page.tsx`: same data and strings; new header (accent line, serif title,
  date chip), stat tiles with icons, cards with icons, corner waves and arrow links.
- `components/charts/charts.tsx`: `StatTile` and `ChartCard` take an optional `icon`; warm card style;
  "Show table" button with icon; the y-axis no longer shows fake values (1, 1, 1, 0, 0) when there's no data.

## All other signed-in pages (groups, loans, deposits, manual payments, loans management, reports,
## users, admin, settings, profile, help)
- Cards, inputs and menus: `--color-bg` is now the warm card colour (#fffaf6; dark #241c17), so every
  `bg-bg` surface reads as a card on the cream page. The real page backgrounds (shell, loading screen,
  offline page) use `bg-background`.
- New `--color-bg-muted` token. It was used in 9 places but never defined, so loan progress-bar tracks,
  "Cancelled" badges and a table header had no background.
- Page titles use the serif display style (`PageHeader` in both `components/ui` and
  `components/dashboard`, and the 10 pages/sections with their own `<h1>`).
- Page wrappers no longer paint their own full-height background over the shell art
  (`min-h-screen bg-bg-muted/30 py-6` → `pb-6 lg:pt-2`).
- Base components (`components/ui`): card, dialog, alert dialog, select, tooltip, stat card,
  empty state and the large button sizes go from `rounded-xl` to 8px or less; tabs are a warm
  segmented control (active tab white with clay text); badges use 5px corners, and the success/warning
  badges use the leaf-green/amber tokens with dark-mode colours.
- Status pills (loan status, roles, filters) use small rounded rectangles instead of full pills;
  soft icon circles become small rounded squares. Avatars, status dots, switches and progress bars stay round.
- The tab lists on loans, loans management, deposits and group detail drop their one-off
  background overrides so they all match.
- Status colours (green = paid, amber = due soon, red = overdue) are unchanged.

Lint: the 16 ESLint warnings across `app components lib` are exactly the ones already in the original
project; none are new.

## Medium spacing (signed-in app and shared UI components)
One step down on the spacing scale, applied as an exact token map (no chained replacements):
- Page gutter `p-page`: 12px on phones, 16px from `sm`, 24px × 20px from `lg` (was up to 32px × 24px).
- Cards and panels: 16px inside (was 20–24px); dialogs, `StatCard` and shadcn `Card` 20px (was 24px).
- Gaps and stacks: 24px → 20px, 20px → 16px; large empty/loading states 64px → 40px of vertical padding.
- The sign-in screens keep their own spacing.

## Auth (from the previous step)
- `components/auth/auth-shell.tsx`, `login-art.tsx`, `app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`.

All behaviour (routing, guards, collapse, mobile drawer, i18n, dark mode) is unchanged.
Checked: `tsc --noEmit` clean; `eslint` 0 errors (1 existing warning in app-shell);
`pnpm test` 24/24; Tailwind compiles every new class. Not yet viewed in a browser.
The PWA icons in `public/icons` are still the old green; regenerate them if you want them clay.
