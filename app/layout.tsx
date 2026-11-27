import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: { default: "E-kimina", template: "%s · E-kimina" },
  description: "Save, borrow and keep your ikimina's books together.",
  applicationName: "E-kimina",
  appleWebApp: { capable: true, title: "E-kimina", statusBarStyle: "default" },
  icons: { apple: "/icons/apple-touch-icon.png", icon: [{ url: "/icons/icon-192.png", sizes: "192x192" }] },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#005840",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, playfair.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}