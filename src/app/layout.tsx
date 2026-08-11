import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

import { KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo";

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

const siteUrl = SITE_URL;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ilyos Salayev — sun'iy intellekt muhandisi va veb dasturchi",
    template: "%s · Ilyos Salayev",
  },
  description:
    "Ovoz, xotira va real vaqt oqimlari ustida ishlaydigan sun'iy intellekt mahsulotlari. " +
    "Biznes uchun saytlar, tayyor veb-yechimlar va muhandislik xizmatlari. Toshkent.",
  keywords: KEYWORDS,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "technology",
  // One canonical origin, and the Uzbek page is the default for every locale
  // that has no translation of its own.
  alternates: {
    canonical: "/",
    languages: { "uz-UZ": "/", "x-default": "/" },
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    alternateLocale: ["ru_RU", "en_US"],
    siteName: SITE_NAME,
    url: siteUrl,
    title: "Ilyos Salayev — sun'iy intellekt muhandisi va veb dasturchi",
    description:
      "Ovoz, xotira va real vaqt tizimlari. Tayyor saytlar va muhandislik xizmatlari. Toshkent.",
    images: [
      {
        url: "/me/portrait.webp",
        width: 1400,
        height: 1400,
        alt: "Ilyos Salayev — sun'iy intellekt muhandisi, Toshkent",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ilyos Salayev — sun'iy intellekt muhandisi",
    description: "Ovoz, xotira va real vaqt tizimlari. Tayyor saytlar. Toshkent.",
    images: ["/me/portrait.webp"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { telephone: false, address: false, email: false },
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
