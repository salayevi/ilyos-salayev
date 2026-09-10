import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { KEYWORDS, SITE_NAME, SITE_URL } from "@/lib/seo";

import "./globals.css";

/*
  Self-hosted, not fetched.

  `next/font/google` downloads the face at build time, which quietly made a
  production build require internet access to Google's CDN — an offline machine,
  a locked-down CI runner or a Google outage all turned into a failed deploy of
  a site that has nothing to do with Google. The files below are the exact same
  latin subsets that loader was fetching, committed to the repository.

  `next/font/local` still does the work that matters: it hashes and serves the
  files from our own origin, generates the `@font-face` rules, and computes the
  fallback metrics that keep the layout from shifting when the face arrives.
*/
const geist = localFont({
  src: "./fonts/Geist-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist",
  display: "swap",
  // Measured against the real face so the fallback occupies the same space.
  adjustFontFallback: "Arial",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});

const geistMono = localFont({
  src: "./fonts/GeistMono-Variable.woff2",
  weight: "100 900",
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "Menlo", "monospace"],
});

const instrument = localFont({
  src: [
    { path: "./fonts/InstrumentSerif-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/InstrumentSerif-Italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-instrument-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Didot", "Georgia", "serif"],
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
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    shortcut: ["/icon.png"],
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#050203",
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
      // The script below adds `js` to this element before React hydrates, so
      // the DOM's class list is one entry ahead of what the server sent — by
      // design, and React reported it as an <html> className mismatch it
      // "won't patch up" on every single render. Suppressing here covers only
      // this element's own attributes; children still hydrate strictly.
      suppressHydrationWarning
    >
      {/*
        Browser extensions stamp attributes onto <body> before React hydrates —
        the reported mismatch carried a `bis_register` attribute, which is an
        extension's doing, not ours. Suppressing here covers only this element's
        own attributes; children still hydrate strictly.
      */}
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/*
          Two jobs, before anything else paints.

          `js` switches the reveal system on. The stylesheet keeps content
          visible until this class exists, so scripting being off or the bundle
          failing to load leaves a readable page instead of a blank one.

          The timer is the deadline. If the reveal system has not cleared it —
          because hydration threw, the chunk 404ed, or the device gave up —
          every hidden element is released.

          It is the first child of <body>, not of <html>. A `<script>` is not a
          legal child of `<html>`, so the parser relocated it and React could
          no longer line the server's tree up with the DOM: every render logged
          "In HTML, <script> cannot be a child of <html>" and then an <html>
          `className` mismatch it refused to patch. Here the markup is valid,
          and the guard still does its job — the parser executes this before it
          has read a single element of the page, which is well before React.
        */}
        <script
          // Static string, no interpolation, no user input.
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');" +
              "window.__revealFailsafe=setTimeout(function(){" +
              "document.documentElement.classList.add('reveal-failsafe')},4000);",
          }}
        />
        {children}
      </body>
    </html>
  );
}
