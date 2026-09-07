import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/ArticleList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { SafeImage } from "@/components/SafeImage";
import { SectionHeading } from "@/components/SectionHeading";
import { getAuthorPage } from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { formatDate, toIso } from "@/lib/format";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getAuthorPage(params.slug, 1);
  if (!data) return { title: "Not found", robots: { index: false } };
  return {
    title: data.author.name,
    description: data.author.bio ?? `Stories by ${data.author.name}.`,
    alternates: { canonical: `${siteUrl}/author/${data.author.slug}` },
  };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function AuthorPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const [data, settings] = await Promise.all([getAuthorPage(params.slug, page), getSettings()]);
  if (!data) notFound();
  const { author, sectionsCovered, firstPublishedAt } = data;

  const storyCount = `${data.total} ${data.total === 1 ? "story" : "stories"}`;
  const fallbackBio = `${author.name} writes for ${settings.siteName}${
    sectionsCovered.length ? `, covering ${sectionsCovered.map((s) => s.name).join(", ")}` : ""
  }.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: author.name,
    url: `${siteUrl}/author/${author.slug}`,
    description: author.bio ?? fallbackBio,
    image: author.avatar?.url,
    worksFor: { "@type": "Organization", name: settings.siteName, url: siteUrl },
  };

  return (
    <div className="container py-6">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Authors" }, { label: author.name }]}
      />

      <section
        aria-labelledby="about-author"
        className="mt-4 grid gap-8 border-b-2 border-ink pb-8 md:grid-cols-[auto_1fr]"
      >
        <div className="h-32 w-32 shrink-0 overflow-hidden rounded-full bg-rule/60 md:h-40 md:w-40">
          {author.avatar ? (
            <SafeImage media={author.avatar} aspect="1/1" sizes="160px" useThumb />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-muted md:text-5xl"
            >
              {initials(author.name)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p
            id="about-author"
            className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-wire-text"
          >
            About the author
          </p>
          <h1 className="mt-1 text-balance font-display text-4xl font-bold md:text-5xl">
            {author.name}
          </h1>
          <p className="mt-3 max-w-2xl text-pretty font-body text-lg leading-snug text-ink md:text-xl">
            {author.bio ?? fallbackBio}
          </p>

          <dl className="mt-5 grid gap-x-8 gap-y-3 font-ui text-sm sm:grid-cols-3">
            <div>
              <dt className="text-[11px] uppercase tracking-wide text-muted">Published</dt>
              <dd className="mt-0.5 font-semibold">{storyCount}</dd>
            </div>
            {firstPublishedAt ? (
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted">Writing since</dt>
                <dd className="mt-0.5 font-semibold">
                  <time dateTime={toIso(firstPublishedAt)}>
                    {formatDate(firstPublishedAt, "MMMM yyyy")}
                  </time>
                </dd>
              </div>
            ) : null}
            {sectionsCovered.length ? (
              <div>
                <dt className="text-[11px] uppercase tracking-wide text-muted">Covers</dt>
                <dd className="mt-0.5 flex flex-wrap gap-1.5">
                  {sectionsCovered.map((s) => (
                    <Link
                      key={s.slug}
                      href={`/section/${s.slug}`}
                      className="rounded-full border border-rule px-2.5 py-0.5 text-xs font-medium hover:bg-ink hover:text-paper"
                      prefetch={false}
                    >
                      {s.name}
                    </Link>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </section>

      <section aria-labelledby="author-stories" className="mt-8">
        <SectionHeading title={`Stories by ${author.name}`} id="author-stories" />
        <ArticleList
          items={data.items}
          page={data.page}
          totalPages={data.totalPages}
          basePath={`/author/${author.slug}`}
          emptyMessage="No published stories yet."
        />
      </section>
    </div>
  );
}
