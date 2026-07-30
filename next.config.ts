import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon; bundling it breaks the .node binding
  // lookup, so it has to stay an external require on the server.
  serverExternalPackages: ["better-sqlite3"],
  // A stray lockfile further up the filesystem makes Next guess the wrong
  // workspace root, which changes how files resolve. Pin it.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
