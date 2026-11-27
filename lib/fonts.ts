import { Fraunces, Jost } from "next/font/google";

/* Brand typefaces, loaded once in app/layout.tsx.
   - Jost: the app's sans (`font-sans`) — body copy, navigation, numbers.
   - Fraunces: the display serif (`font-display`) — page titles, the wordmark, code boxes. */

export const brandSans = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const brandDisplay = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-display-serif",
  display: "swap",
});
