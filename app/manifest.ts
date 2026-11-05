import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "UNZA Navigator",
    short_name: "UNZA",
    description: "Navigate campus, book rooms and chat with fellow students.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f6f9",
    theme_color: "#008236",
    categories: ["education", "navigation"],
    icons: [
      { src: "/images/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/images/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
    shortcuts: [
      { name: "Navigate", url: "/navigation" },
      { name: "Messages", url: "/chat" },
      { name: "Bookings", url: "/bookings" },
    ],
  };
}
