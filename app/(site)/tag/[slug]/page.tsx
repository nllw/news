import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleList } from "@/components/ArticleList";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getTagPage } from "@/lib/data/articles";
import { siteUrl } from "@/lib/env";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getTagPage(params.slug, 1);
  if (!data) return { title: "Not found", robots: { index: false } };
  return {
    title: data.tag.name,
    description: `Stories about ${data.tag.name}.`,
    alternates: { canonical: `${siteUrl}/tag/${data.tag.slug}` },
  };
}

export default async function TagPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const data = await getTagPage(params.slug, page);
  if (!data) notFound();

  return (
    <div className="container py-6">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Topics" }, { label: data.tag.name }]}
      />
      <header className="mb-8 mt-4 border-b-2 border-ink pb-4">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
          Topic
        </p>
        <h1 className="font-display text-4xl font-bold md:text-5xl">{data.tag.name}</h1>
        <p className="mt-1 font-ui text-xs text-muted">{data.total} stories</p>
      </header>
      <ArticleList
        items={data.items}
        page={data.page}
        totalPages={data.totalPages}
        basePath={`/tag/${data.tag.slug}`}
      />
    </div>
  );
}
