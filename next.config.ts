import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A stray lockfile further up the filesystem makes Next guess the wrong
  // workspace root, which changes how files resolve. Pin it.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
