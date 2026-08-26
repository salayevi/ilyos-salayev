import type { NextConfig } from "next";

const development = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  `script-src 'self' 'unsafe-inline'${development ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self'",
  `connect-src 'self'${development ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(development ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const nextConfig: NextConfig = {
  // A stray lockfile further up the filesystem makes Next guess the wrong
  // workspace root, which changes how files resolve. Pin it.
  turbopack: { root: import.meta.dirname },
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=(), fullscreen=(self)",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        /*
          Both hosts served a 200, so every page existed at two addresses and
          the crawler had to pick. The canonical tag already pointed at the
          apex, but a canonical is a hint — a 301 is the answer, and it also
          stops link equity splitting across the two spellings.

          Kept in the app rather than as a Vercel domain redirect so the rule
          travels with the code: a preview deployment behaves like production,
          and the reason it exists is written next to it.
        */
        source: "/:path*",
        has: [{ type: "host", value: "www.ilyos-salayev.site" }],
        destination: "https://ilyos-salayev.site/:path*",
        permanent: true,
      },
      {
        /*
          /services listed three engagement shapes with their own prices while
          /pricing listed the catalogue with its own — the same work quoted two
          ways depending on which page a buyer landed on. The catalogue won,
          the old page is gone, and this is a 301 rather than a deletion
          because the URL is in the sitemap and carries whatever authority it
          has accrued.
        */
        source: "/services",
        destination: "/pricing",
        permanent: true,
      },
      {
        source: "/admin/services/:path*",
        destination: "/admin/pricing",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
