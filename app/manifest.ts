import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "جيبك - أمّن جيبك",
    short_name: "جيبك",
    description: "خطط لمصروفاتك وتابع ميزانيتك بسهولة.",
    start_url: "/overview",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#F8FAFC",
    theme_color: "#4F46E5",
    dir: "rtl",
    lang: "ar-EG",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
