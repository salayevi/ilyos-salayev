import type { Metadata } from "next";

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
  if (/^https?:\/\//i.test(path)) return path;
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
    // The dragon monogram is the service mark. Declaring it separately from the
    // portrait lets a search result show the brand where a face would be wrong.
    logo: abs("/brand/logo-512.png"),
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

/**
 * The service side of the same identity. A Person explains who does the work;
 * an Organization is what a buyer of a ready-made site is transacting with, and
 * it is the node Google reads for a brand logo in results.
 */
export function organizationSchema(s: SiteSettings): Jsonld {
  return {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      url: abs("/brand/logo-512.png"),
      width: 512,
      height: 512,
      caption: `${SITE_NAME} — xizmat logotipi`,
    },
    image: abs("/brand/logo-512.png"),
    email: s.email ? `mailto:${s.email}` : undefined,
    founder: { "@id": `${SITE_URL}/#person` },
    areaServed: "UZ",
    knowsLanguage: ["uz", "ru", "en"],
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

/**
 * The Open Graph fields every page must keep.
 *
 * Metadata objects are merged *shallowly*: a page that declares `openGraph` at
 * all replaces the layout's entire object, not just the keys it names. So the
 * home page setting `openGraph: { title, description }` silently dropped the
 * image, the url, the type and the locale — and the most-shared URL on the site
 * was the one posting to Telegram and LinkedIn with no preview card.
 *
 * Spread this into any page-level `openGraph` and override from there. The
 * pattern is the one Next's own docs prescribe for exactly this trap.
 */
export function openGraphBase(path = "/") {
  return {
    type: "website" as const,
    locale: "uz_UZ",
    siteName: SITE_NAME,
    /*
      The root spelled without its trailing slash, to match the canonical tag.

      `abs("/")` yields `https://…/` while `alternates.canonical` resolves to
      `https://…` — two spellings of one address in the same document. Crawlers
      usually reconcile that, but "usually" is the whole reason the canonical
      tag exists, and disagreeing with yourself is a strange thing to ask a
      crawler to resolve.
    */
    url: path === "/" ? SITE_URL : abs(path),
    images: [
      {
        url: abs("/me/portrait.webp"),
        width: 1400,
        height: 1400,
        alt: `${SITE_NAME} — sun'iy intellekt muhandisi, Toshkent`,
      },
    ],
  };
}

type PageMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
};

/**
 * Complete route metadata. Every public page calls this instead of inheriting
 * the root URL, so canonical, Open Graph and Twitter always describe the URL
 * that was actually shared.
 */
export function pageMetadata(input: PageMetadataInput): Metadata {
  const fallback = openGraphBase(input.path);
  const images = input.image
    ? [{ url: abs(input.image), alt: input.imageAlt ?? input.title }]
    : fallback.images;
  const shared = {
    ...fallback,
    title: input.title,
    description: input.description,
    images,
  };
  const openGraph =
    input.type === "article"
      ? {
          ...shared,
          type: "article" as const,
          publishedTime: input.publishedTime,
          modifiedTime: input.modifiedTime,
        }
      : shared;

  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
      languages: { "uz-UZ": input.path, "x-default": input.path },
    },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: images.map((image) => ({ url: image.url, alt: image.alt })),
    },
  };
}
