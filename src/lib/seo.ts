import type { ProductView, ProjectView, SiteSettings } from "@/lib/queries";

/**
 * The canonical origin. Everything the crawler is told — sitemap entries,
 * canonical tags, Open Graph URLs, structured data ids — is built from this one
 * value, so a domain move is a single environment change rather than a hunt
 * through the codebase.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ilyos-salayev.site").replace(
  /\/$/,
  "",
);

export const SITE_NAME = "Ilyos Salayev";

export function abs(path: string) {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Terms a real person would type to find this work.
 *
 * Search engines stopped rewarding keyword stuffing two decades ago — a page
 * padded with every word someone might type ranks worse, not better, because
 * relevance is judged on how well the page answers one query. These are the
 * queries this site can honestly answer, in the three languages its audience
 * actually searches in.
 */
export const KEYWORDS = [
  "Ilyos Salayev",
  "Ilyos Salayev portfolio",
  "sun'iy intellekt muhandisi",
  "AI muhandis Toshkent",
  "veb dasturchi Toshkent",
  "Next.js dasturchi O'zbekiston",
  "tayyor sayt sotib olish",
  "biznes uchun sayt yaratish",
  "ovozli agent ishlab chiqish",
  "AI engineer Uzbekistan",
  "full stack developer Tashkent",
  "разработчик сайтов Ташкент",
];

type Jsonld = Record<string, unknown>;

/** The person the site is about — the anchor for every other entity. */
export function personSchema(s: SiteSettings): Jsonld {
  const sameAs = [s.github, s.linkedin, s.telegram ? `https://t.me/${s.telegram.replace(/^@/, "")}` : ""]
    .filter(Boolean);

  return {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: SITE_NAME,
    url: SITE_URL,
    image: abs("/me/portrait.webp"),
    jobTitle: "Sun'iy intellekt muhandisi",
    email: s.email ? `mailto:${s.email}` : undefined,
    address: s.location
      ? { "@type": "PostalAddress", addressLocality: s.location, addressCountry: "UZ" }
      : undefined,
    knowsLanguage: ["uz", "ru", "en"],
    knowsAbout: [
      "Sun'iy intellekt",
      "Ovozli agentlar",
      "Next.js",
      "PostgreSQL",
      "Rust",
      "Python",
    ],
    sameAs: sameAs.length ? sameAs : undefined,
  };
}

export function websiteSchema(s: SiteSettings): Jsonld {
  return {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: "uz-UZ",
    description: s.heroSubline,
    publisher: { "@id": `${SITE_URL}/#person` },
  };
}

export function breadcrumbSchema(trail: { name: string; path: string }[]): Jsonld {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((step, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: step.name,
      item: abs(step.path),
    })),
  };
}

/** A case study is a creative work, not a product — it is not for sale. */
export function projectSchema(p: ProjectView): Jsonld {
  return {
    "@type": "CreativeWork",
    "@id": abs(`/work/${p.slug}`),
    name: p.title,
    headline: p.title,
    description: p.summary,
    url: abs(`/work/${p.slug}`),
    dateCreated: p.year,
    image: p.previewImage ? abs(p.previewImage) : undefined,
    creator: { "@id": `${SITE_URL}/#person` },
    keywords: p.stack.join(", ") || undefined,
    about: p.category,
  };
}

/** A listing has a price and a stock state, so it is a real Product offer. */
export function productSchema(p: ProductView): Jsonld {
  const availability =
    p.status === "sold"
      ? "https://schema.org/SoldOut"
      : p.status === "reserved"
        ? "https://schema.org/LimitedAvailability"
        : "https://schema.org/InStock";

  return {
    "@type": "Product",
    "@id": abs(`/tayyor-saytlar/${p.slug}`),
    name: p.title,
    description: p.summary || p.description,
    url: abs(`/tayyor-saytlar/${p.slug}`),
    image: p.previewImage ? abs(p.previewImage) : abs("/me/portrait.webp"),
    category: p.category,
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      price: p.price,
      priceCurrency: p.currency,
      availability,
      url: abs(`/tayyor-saytlar/${p.slug}`),
      seller: { "@id": `${SITE_URL}/#person` },
    },
  };
}

export function articleSchema(post: {
  slug: string;
  title: string;
  excerpt: string;
  createdAt: Date;
  updatedAt: Date;
}): Jsonld {
  return {
    "@type": "BlogPosting",
    "@id": abs(`/journal/${post.slug}`),
    headline: post.title,
    description: post.excerpt,
    url: abs(`/journal/${post.slug}`),
    datePublished: post.createdAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
    inLanguage: "uz-UZ",
  };
}

/**
 * Wraps entities in one `@graph` rather than emitting several script tags.
 * A single graph lets the nodes reference each other by `@id`, which is how a
 * crawler learns that the author of a post and the seller of a listing are the
 * same person.
 */
export function jsonLd(...nodes: Jsonld[]) {
  return JSON.stringify(
    { "@context": "https://schema.org", "@graph": nodes.filter(Boolean) },
    // Drop undefined branches so the payload stays small and valid.
    (_key, value) => (value === undefined ? undefined : value),
  );
}
