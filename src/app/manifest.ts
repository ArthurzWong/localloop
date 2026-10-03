import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LocalLoop — Travel local. Spend local. Keep the value local.",
    short_name: "LocalLoop",
    description:
      "Discover locally owned businesses and see where your tourism spending keeps the most value in the community.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf7f1",
    theme_color: "#c4552b",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}