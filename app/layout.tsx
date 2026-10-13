import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: {
    default: "ميزانيتي تكفّي؟",
    template: "%s | ميزانيتي تكفّي؟",
  },
  description:
    "احسب ميزانيتك وشوف هتكفيك لحد إمتى. أداة تخطيط مالي بسيطة وخاصة — بياناتك على جهازك بس.",
  keywords: ["ميزانية", "تخطيط مالي", "مصاريف", "بجت", "budget", "calculator"],
  openGraph: {
    title: "ميزانيتي تكفّي؟",
    description: "احسب ميزانيتك وشوف هتكفيك لحد إمتى.",
    locale: "ar_EG",
    type: "website",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: "#2563EB",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={ibmPlexSansArabic.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}
