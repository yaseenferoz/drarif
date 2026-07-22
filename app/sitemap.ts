import type { MetadataRoute } from "next";
import { articles, treatments } from "@/lib/site-data";

const publicPages = [
  "about",
  "treatments",
  "articles",
  "gallery",
  "booking",
  "contact",
  "privacy",
  "terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://drarif.vercel.app";
  const now = new Date();
  return [
    { url: base, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...publicPages.map((page) => ({
      url: `${base}/${page}`,
      lastModified: now,
      changeFrequency:
        page === "privacy" || page === "terms"
          ? ("yearly" as const)
          : ("weekly" as const),
      priority: page === "booking" ? 0.9 : 0.7,
    })),
    ...treatments.map((item) => ({
      url: `${base}/treatments/${item.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((item) => ({
      url: `${base}/articles/${item.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
