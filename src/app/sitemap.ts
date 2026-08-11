import type { MetadataRoute } from "next";

import { getPosts, getProducts, getProjects } from "@/lib/queries";
import { abs } from "@/lib/seo";

// Content is editable at any time, so the sitemap is built per request rather
// than frozen at build.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products, posts] = await Promise.all([
    getProjects({ onlyPublished: true }),
    getProducts({ onlyPublished: true }),
    getPosts({ onlyPublished: true }),
  ]);

  const now = new Date();

  // Priorities describe how the site sees itself: the landing page first, then
  // the two pages that convert (work and the store), then the rest.
  const staticPages: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: abs("/work"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: abs("/tayyor-saytlar"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: abs("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/journal"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];

  return [
    ...staticPages,
    ...projects.map((p) => ({
      url: abs(`/work/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...products.map((p) => ({
      url: abs(`/tayyor-saytlar/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: abs(`/journal/${p.slug}`),
      lastModified: p.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
