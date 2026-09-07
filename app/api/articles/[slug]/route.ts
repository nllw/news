import { NextResponse } from "next/server";
import { getPublishedArticleBySlug, resolveSlugRedirect } from "@/lib/data/articles";
import { siteUrl } from "@/lib/env";

export const revalidate = 60;

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  let article = await getPublishedArticleBySlug(params.slug);
  if (!article) {
    const target = await resolveSlugRedirect(params.slug);
    if (target) return NextResponse.redirect(`${siteUrl}/api/articles/${target}`, 308);
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(
    {
      id: article.id,
      slug: article.slug,
      url: `${siteUrl}/article/${article.slug}`,
      headline: article.headline,
      dek: article.dek,
      bodyHtml: article.bodyHtml,
      excerpt: article.excerpt,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      readingTime: article.readingTime,
      wordCount: article.wordCount,
      section: { name: article.section.name, slug: article.section.slug },
      author: { name: article.author.name, slug: article.author.slug },
      tags: article.tags.map((t) => ({ name: t.tag.name, slug: t.tag.slug })),
      image: article.featuredImage
        ? {
            url: article.featuredImage.url,
            alt: article.featuredImage.alt,
            credit: article.featuredImage.credit,
            caption: article.featuredImageCaption,
            width: article.featuredImage.width,
            height: article.featuredImage.height,
          }
        : null,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
