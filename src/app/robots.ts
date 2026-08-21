import type { MetadataRoute } from "next";

import { abs, SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The panel and the byte-serving endpoint have nothing to offer a
        // crawler, and keeping them out of the index avoids wasting crawl
        // budget on pages that only ever redirect to a login.
        disallow: ["/admin", "/admin/", "/api/", "/hisob/"],
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: SITE_URL,
  };
}
