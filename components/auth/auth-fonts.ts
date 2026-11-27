import { Fraunces, Jost } from "next/font/google";

/* Fonts for the auth screens only: Fraunces for headings and code boxes, Jost for everything else.
   They are applied on the AuthShell root, so the rest of the app keeps Inter / Playfair. */

export const authDisplayFont = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-auth-display",
  display: "swap",
});

export const authBodyFont = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-auth-body",
  display: "swap",
});
