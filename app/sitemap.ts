import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://ownmytwin.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url:              BASE_URL,
      lastModified:     new Date(),
      changeFrequency:  "weekly",
      priority:         1.0,
    },
    {
      url:              `${BASE_URL}/marketplace`,
      lastModified:     new Date(),
      changeFrequency:  "daily",
      priority:         0.9,
    },
    {
      url:              `${BASE_URL}/showcase`,
      lastModified:     new Date(),
      changeFrequency:  "daily",
      priority:         0.7,
    },
  ];

  // Public twin profiles — only marketplace-visible twins with a slug
  const publicTwins = await db.user.findMany({
    where: {
      publicSlug:  { not: null },
      twin: { marketplaceVisible: true },
    },
    select: {
      publicSlug: true,
      updatedAt:  true,
    },
    orderBy: { updatedAt: "desc" },
    take: 1000,
  });

  const profilePages: MetadataRoute.Sitemap = publicTwins
    .filter((u) => u.publicSlug)
    .map((u) => ({
      url:             `${BASE_URL}/p/${u.publicSlug}`,
      lastModified:    u.updatedAt,
      changeFrequency: "weekly" as const,
      priority:        0.8,
    }));

  return [...staticPages, ...profilePages];
}
