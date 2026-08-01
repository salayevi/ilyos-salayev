import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ilyos Salayev — sun'iy intellekt muhandisi",
    template: "%s · Ilyos Salayev",
  },
  description:
    "Ovoz, xotira va real vaqt oqimlari ustida ishlaydigan sun'iy intellekt mahsulotlari. Toshkent.",
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    siteName: "Ilyos Salayev",
    url: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="uz"
      // Declares the smooth scrolling set in globals.css so Next can suppress it
      // during route transitions — without it every navigation animates the
      // scroll reset, and the dev server logs a warning on each render.
      data-scroll-behavior="smooth"
      className={`${geist.variable} ${geistMono.variable} ${instrument.variable} h-full antialiased`}
    >
      {/*
        Browser extensions stamp attributes onto <body> before React hydrates —
        the reported mismatch carried a `bis_register` attribute, which is an
        extension's doing, not ours. Suppressing here covers only this element's
        own attributes; children still hydrate strictly.
      */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
