import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { listAllPublishedForSitemap } from "@/lib/data/articles";
import { siteUrl } from "@/lib/env";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, sections, authors, tags] = await Promise.all([
    listAllPublishedForSitemap(),
    prisma.section.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.author.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.tag.findMany({ select: { slug: true, createdAt: true } }),
  ]);

  const statics: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "hourly", priority: 1 },
    { url: `${siteUrl}/latest`, changeFrequency: "hourly", priority: 0.8 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.3 },
  ];

  return [
    ...statics,
    ...articles.map((a) => ({
      url: `${siteUrl}/article/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...sections.map((s) => ({
      url: `${siteUrl}/section/${s.slug}`,
      lastModified: s.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
    ...authors.map((a) => ({
      url: `${siteUrl}/author/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.4,
    })),
    ...tags.map((t) => ({
      url: `${siteUrl}/tag/${t.slug}`,
      lastModified: t.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.3,
    })),
  ];
}
