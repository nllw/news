import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleMeta } from "@/components/ArticleMeta";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { Kicker } from "@/components/Kicker";
import { RelatedArticles } from "@/components/RelatedArticles";
import { SafeImage } from "@/components/SafeImage";
import { ShareBar } from "@/components/ShareBar";
import {
  getAdjacentArticles,
  getPublishedArticleBySlug,
  getRelatedArticles,
  listRecentSlugs,
  resolveSlugRedirect,
} from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { toIso } from "@/lib/format";
import { truncate } from "@/lib/utils";

export const revalidate = 60;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const recent = await listRecentSlugs(50);
    return recent.map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) return { title: "Not found", robots: { index: false } };
  const settings = await getSettings();
  const title = article.seoTitle ?? article.headline;
  const description = article.seoDescription ?? article.dek ?? truncate(article.excerpt, 160);
  const url = `${siteUrl}/article/${article.slug}`;
  // og:image and twitter:image come from the opengraph-image.tsx file convention in
  // this folder, which renders the featured image with the headline overlaid.

  return {
    title,
    description,
    alternates: { canonical: article.canonicalUrl ?? url },
    openGraph: {
      type: "article",
      url,
      title,
      description,
      siteName: settings.siteName,
      publishedTime: toIso(article.publishedAt) || undefined,
      modifiedTime: toIso(article.updatedAt) || undefined,
      authors: [`${siteUrl}/author/${article.author.slug}`],
      section: article.section.name,
      tags: article.tags.map((t) => t.tag.name),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getPublishedArticleBySlug(params.slug);
  if (!article) {
    const target = await resolveSlugRedirect(params.slug);
    if (target) permanentRedirect(`/article/${target}`);
    notFound();
  }

  const [settings, related, adjacent] = await Promise.all([
    getSettings(),
    getRelatedArticles({ id: article.id, sectionId: article.sectionId, tags: article.tags }),
    getAdjacentArticles(article),
  ]);

  const url = `${siteUrl}/article/${article.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.dek || article.excerpt,
    image: article.featuredImage ? [article.featuredImage.url] : undefined,
    datePublished: toIso(article.publishedAt),
    dateModified: toIso(article.updatedAt),
    author: [
      {
        "@type": "Person",
        name: article.author.name,
        url: `${siteUrl}/author/${article.author.slug}`,
      },
    ],
    publisher: { "@type": "Organization", name: settings.siteName, url: siteUrl },
    articleSection: article.section.name,
    keywords: article.tags.map((t) => t.tag.name).join(", ") || undefined,
    wordCount: article.wordCount,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isAccessibleForFree: true,
  };

  return (
    <div className="container py-6">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: article.section.name, href: `/section/${article.section.slug}` },
          { label: article.headline },
        ]}
      />

      <article className="mx-auto mt-6 max-w-3xl">
        <header className="space-y-4">
          <Kicker section={article.section} />
          <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] md:text-5xl">
            {article.headline}
          </h1>
          {article.dek ? (
            <p className="text-pretty font-body text-xl leading-snug text-muted md:text-2xl">
              {article.dek}
            </p>
          ) : null}
          <div className="flex flex-wrap items-end justify-between gap-4 border-y border-rule py-3">
            <ArticleMeta
              author={article.author}
              publishedAt={article.publishedAt}
              updatedAt={article.updatedAt}
              readingTime={article.readingTime}
            />
            <ShareBar url={url} title={article.headline} className="lg:hidden" />
          </div>
        </header>

        {article.featuredImage ? (
          <figure className="mt-6">
            <SafeImage
              media={article.featuredImage}
              aspect="auto"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
            {article.featuredImageCaption || article.featuredImage.credit ? (
              <figcaption className="mt-2 font-ui text-xs text-muted">
                {article.featuredImageCaption}
                {article.featuredImage.credit ? (
                  <span className="ml-1 uppercase tracking-wide">
                    {article.featuredImage.credit}
                  </span>
                ) : null}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <div className="relative mt-8 lg:grid lg:grid-cols-[3rem_1fr] lg:gap-8">
          <div className="hidden lg:block">
            <ShareBar
              url={url}
              title={article.headline}
              orientation="vertical"
              className="sticky top-20"
            />
          </div>
          <ArticleBody html={article.bodyHtml} />
        </div>

        {article.tags.length > 0 ? (
          <ul className="mt-10 flex flex-wrap gap-2 font-ui text-xs" aria-label="Topics">
            {article.tags.map((t) => (
              <li key={t.tagId}>
                <Link
                  href={`/tag/${t.tag.slug}`}
                  className="inline-block rounded-full border border-rule px-3 py-1 hover:bg-ink hover:text-paper"
                  prefetch={false}
                >
                  {t.tag.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <footer className="mt-10 border-t border-rule pt-6">
          <ArticleMeta
            author={article.author}
            publishedAt={article.publishedAt}
            updatedAt={article.updatedAt}
          />
        </footer>
      </article>

      {(adjacent.previous || adjacent.next) && (
        <nav
          aria-label="More stories"
          className="mx-auto mt-12 grid max-w-3xl gap-6 border-t border-rule pt-6 sm:grid-cols-2"
        >
          {adjacent.previous ? (
            <Link
              href={`/article/${adjacent.previous.slug}`}
              className="group space-y-1"
              prefetch={false}
            >
              <span className="inline-flex items-center gap-1 font-ui text-[11px] uppercase tracking-wide text-muted">
                <ArrowLeft className="h-3 w-3" aria-hidden="true" /> Earlier
              </span>
              <span className="block font-display text-lg font-bold leading-snug group-hover:underline">
                {adjacent.previous.headline}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {adjacent.next ? (
            <Link
              href={`/article/${adjacent.next.slug}`}
              className="group space-y-1 sm:text-right"
              prefetch={false}
            >
              <span className="inline-flex items-center gap-1 font-ui text-[11px] uppercase tracking-wide text-muted">
                Later <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
              <span className="block font-display text-lg font-bold leading-snug group-hover:underline">
                {adjacent.next.headline}
              </span>
            </Link>
          ) : null}
        </nav>
      )}

      <RelatedArticles articles={related} />
    </div>
  );
}
