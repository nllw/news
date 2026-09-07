import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Rss } from "lucide-react";
import { ArticleCard } from "@/components/ArticleCard";
import { HeroStory } from "@/components/HeroStory";
import { SectionHeading } from "@/components/SectionHeading";
import { SearchForm } from "@/components/SearchForm";
import { getFrontPage } from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";
import { formatDate, toIso } from "@/lib/format";
import { siteUrl } from "@/lib/env";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: { absolute: `${settings.siteName}${settings.tagline ? ` | ${settings.tagline}` : ""}` },
    description: settings.description,
    alternates: { canonical: siteUrl },
  };
}

export default async function FrontPage() {
  const [data, settings] = await Promise.all([getFrontPage(), getSettings()]);
  const { hero, secondary, sidebar, grid, mostRecent, sections } = data;
  const isEmpty = !hero && secondary.length === 0 && grid.length === 0 && mostRecent.length === 0;

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsMediaOrganization",
    name: settings.siteName,
    url: siteUrl,
    description: settings.description,
    sameAs: [settings.twitter, settings.facebook, settings.instagram].filter(Boolean),
  };

  if (isEmpty) {
    return (
      <div className="container py-24 text-center">
        <p className="font-display text-3xl font-bold">First edition coming soon.</p>
        <p className="mt-3 font-ui text-sm text-muted">
          Stories will appear here as soon as they are published.
        </p>
        <JsonLd data={orgJsonLd} />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <JsonLd data={orgJsonLd} />

      {/* Lead package */}
      {(hero || secondary.length > 0) && (
        <section
          aria-label="Top stories"
          className="grid gap-8 border-b-2 border-ink pb-8 lg:grid-cols-12"
        >
          <div className="lg:col-span-8">{hero ? <HeroStory article={hero} /> : null}</div>
          {secondary.length > 0 ? (
            <div className="divide-y divide-rule lg:col-span-4 lg:border-l lg:border-rule lg:pl-8">
              {secondary.map((a) => (
                <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                  <ArticleCard article={a} variant="textOnly" showDek={false} />
                </div>
              ))}
            </div>
          ) : null}
        </section>
      )}

      {/* Also reading */}
      {sidebar.length > 0 ? (
        <section aria-labelledby="also-reading" className="border-b border-rule py-6">
          <SectionHeading title="Also reading" id="also-reading" className="mb-4 border-b-0 pb-0" />
          <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {sidebar.map((a) => (
              <ArticleCard key={a.id} article={a} variant="compact" />
            ))}
          </div>
        </section>
      ) : null}

      {/* Section blocks + most recent */}
      <div className="grid gap-10 py-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-8">
          {sections.map(({ section, articles }) => (
            <section key={section.id} aria-labelledby={`section-${section.slug}`}>
              <SectionHeading
                title={section.name}
                href={`/section/${section.slug}`}
                id={`section-${section.slug}`}
              />
              <div className="space-y-6">
                <ArticleCard article={articles[0]} variant="wide" />
                {articles.length > 1 ? (
                  <div className="grid gap-6 border-t border-rule pt-6 sm:grid-cols-3">
                    {articles.slice(1, 4).map((a) => (
                      <ArticleCard key={a.id} article={a} variant="standard" showDek={false} />
                    ))}
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>

        <aside className="lg:col-span-4" aria-labelledby="most-recent">
          <div className="lg:sticky lg:top-16">
            <SectionHeading title="Most recent" id="most-recent" href="/latest" />
            <ol className="divide-y divide-rule">
              {mostRecent.map((a, i) => (
                <li key={a.id} className="flex gap-3 py-3">
                  <span
                    className="font-display text-2xl font-bold leading-none text-rule"
                    aria-hidden="true"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-bold leading-snug">
                      <Link href={`/article/${a.slug}`} className="headline-link line-clamp-2">
                        {a.headline}
                      </Link>
                    </h3>
                    <p className="mt-0.5 font-ui text-[11px] text-muted">
                      <span className="text-wire-text">{a.section.name}</span>
                      {a.publishedAt ? (
                        <>
                          <span aria-hidden="true"> · </span>
                          <time dateTime={toIso(a.publishedAt)}>
                            {formatDate(a.publishedAt, "MMM d")}
                          </time>
                        </>
                      ) : null}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-6 space-y-3 border-t border-rule pt-5">
              <SearchForm />
              <Link
                href="/feed"
                className="inline-flex items-center gap-1.5 font-ui text-xs text-muted hover:text-ink"
                prefetch={false}
              >
                <Rss className="h-3.5 w-3.5" aria-hidden="true" /> Follow in your feed reader
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* More stories */}
      {grid.length > 0 ? (
        <section aria-labelledby="more-stories" className="border-t-2 border-ink pt-8">
          <SectionHeading title="More stories" id="more-stories" href="/latest">
            <Link
              href="/latest"
              className="inline-flex items-center gap-1 font-ui text-xs text-muted hover:text-ink"
              prefetch={false}
            >
              All stories <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </SectionHeading>
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {grid.slice(0, 12).map((a) => (
              <ArticleCard key={a.id} article={a} variant="standard" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
