import type { Metadata, Viewport } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const notoSansArabic = Noto_Sans_Arabic({
  weight: ["400", "500", "600", "700"],
  subsets: ["arabic", "latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#4F46E5",
};

export const metadata: Metadata = {
  title: {
    default: "جيبك",
    template: "%s | جيبك",
  },
  description:
    "احسب ميزانيتك وشوف هتكفيك لحد إمتى. خطط لمصروفاتك واحفظ بياناتك في حسابك الخاص.",
  keywords: ["ميزانية", "تخطيط مالي", "مصاريف", "بجت", "budget", "calculator"],
  openGraph: {
    title: "جيبك",
    description: "احسب ميزانيتك وشوف هتكفيك لحد إمتى.",
    locale: "ar_EG",
    type: "website",
  },
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
      className={notoSansArabic.variable}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-text)] antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
