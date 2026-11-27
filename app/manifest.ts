import type { MetadataRoute } from "next";

/** Installable app (msfts §9): home-screen icon, standalone window, brand colours. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "E-kimina — savings groups",
    short_name: "E-kimina",
    description: "Save, borrow and keep your ikimina's books together.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fcf4ee",
    theme_color: "#b5470f",
    lang: "en",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Pay my contribution", url: "/dashboard/deposits", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My loans", url: "/dashboard/loans", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
