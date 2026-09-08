import { NextResponse, type NextRequest } from "next/server";
import { getLatestPage, getSectionPage } from "@/lib/data/articles";
import { siteUrl } from "@/lib/env";
import type { ArticleSummary } from "@/lib/types";

export const revalidate = 60;

function serialize(a: ArticleSummary) {
  return {
    id: a.id,
    slug: a.slug,
    url: `${siteUrl}/article/${a.slug}`,
    headline: a.headline,
    dek: a.dek,
    excerpt: a.excerpt,
    publishedAt: a.publishedAt,
    updatedAt: a.updatedAt,
    readingTime: a.readingTime,
    section: a.section,
    author: a.author,
    image: a.featuredImage
      ? {
          url: a.featuredImage.url,
          alt: a.featuredImage.alt,
          width: a.featuredImage.width,
          height: a.featuredImage.height,
        }
      : null,
  };
}

/** Public, read-only list of published articles. */
export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") ?? 1) || 1);
  const section = req.nextUrl.searchParams.get("section");

  const result = section ? await getSectionPage(section, page) : await getLatestPage(page);
  if (!result) return NextResponse.json({ error: "Section not found" }, { status: 404 });

  return NextResponse.json(
    {
      items: result.items.map(serialize),
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
