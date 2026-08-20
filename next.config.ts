import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile further up the filesystem makes Next guess the wrong
  // workspace root, which changes how files resolve. Pin it.
  turbopack: { root: import.meta.dirname },

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
    ];
  },
};

export default nextConfig;
