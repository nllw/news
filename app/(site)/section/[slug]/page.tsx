import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/ArticleList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getSectionPage } from "@/lib/data/articles";
import { getSections } from "@/lib/data/taxonomy";
import { siteUrl } from "@/lib/env";

export const revalidate = 60;

export async function generateStaticParams() {
  try {
    return (await getSections()).map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getSectionPage(params.slug, 1);
  if (!data) return { title: "Not found", robots: { index: false } };
  return {
    title: data.section.name,
    description: data.section.description ?? `The latest ${data.section.name} coverage.`,
    alternates: { canonical: `${siteUrl}/section/${data.section.slug}` },
  };
}

export default async function SectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const data = await getSectionPage(params.slug, page);
  if (!data) notFound();

  return (
    <div className="container py-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: data.section.name }]} />
      <header className="mb-8 mt-4 border-b-2 border-ink pb-4">
        <h1 className="font-display text-4xl font-bold md:text-5xl">{data.section.name}</h1>
        {data.section.description ? (
          <p className="mt-2 max-w-2xl font-body text-lg text-muted">{data.section.description}</p>
        ) : null}
      </header>
      <ArticleList
        items={data.items}
        page={data.page}
        totalPages={data.totalPages}
        basePath={`/section/${data.section.slug}`}
        emptyMessage={`No ${data.section.name} stories yet.`}
      />
    </div>
  );
}
