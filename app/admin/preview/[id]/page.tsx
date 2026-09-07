import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleMeta } from "@/components/ArticleMeta";
import { Kicker } from "@/components/Kicker";
import { SafeImage } from "@/components/SafeImage";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { requirePageUser } from "@/lib/auth-guards";
import { getArticleByIdAdmin } from "@/lib/data/admin-articles";
import { getSections } from "@/lib/data/taxonomy";
import { getSettings } from "@/lib/data/settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };

/** Renders any article, whatever its status, using the public components. Signed-in staff only. */
export default async function PreviewPage({ params }: { params: { id: string } }) {
  await requirePageUser();
  const [article, sections, settings] = await Promise.all([
    getArticleByIdAdmin(params.id),
    getSections(),
    getSettings(),
  ]);
  if (!article) notFound();
  const navSections = sections.map((s) => ({ name: s.name, slug: s.slug }));

  return (
    <>
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-amber-400 px-4 py-2 font-ui text-xs text-black">
        <span className="flex items-center gap-2 font-semibold">
          Preview <StatusBadge status={article.status} />
          <span className="font-normal">
            This is how the story will look. It is only visible to signed-in staff.
          </span>
        </span>
        <Link href={`/admin/articles/${article.id}/edit`} className="font-semibold underline">
          Back to editor
        </Link>
      </div>
      <SiteHeader
        settings={settings}
        sections={navSections}
        currentSection={article.section.slug}
      />
      <main id="main" className="container py-6">
        <article className="mx-auto max-w-3xl">
          <header className="space-y-4">
            <Kicker section={article.section} />
            <h1 className="text-balance font-display text-4xl font-bold leading-[1.05] md:text-5xl">
              {article.headline || "Untitled"}
            </h1>
            {article.dek ? (
              <p className="text-pretty font-body text-xl leading-snug text-muted md:text-2xl">
                {article.dek}
              </p>
            ) : null}
            <div className="border-y border-rule py-3">
              <ArticleMeta
                author={article.author}
                publishedAt={article.publishedAt ?? new Date()}
                updatedAt={article.updatedAt}
                readingTime={article.readingTime}
              />
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
          <div className="mt-8">
            <ArticleBody html={article.bodyHtml} />
          </div>
        </article>
      </main>
      <SiteFooter settings={settings} sections={navSections} />
    </>
  );
}
