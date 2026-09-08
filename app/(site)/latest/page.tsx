import type { Metadata } from "next";
import { ArticleList } from "@/components/ArticleList";
import { getLatestPage } from "@/lib/data/articles";
import { siteUrl } from "@/lib/env";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Latest stories",
  description: "Every story, newest first.",
  alternates: { canonical: `${siteUrl}/latest` },
};

export default async function LatestPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const data = await getLatestPage(page);
  return (
    <div className="container py-8">
      <header className="mb-8 border-b-2 border-ink pb-4">
        <h1 className="font-display text-4xl font-bold">Latest stories</h1>
        <p className="mt-1 font-ui text-sm text-muted">{data.total} published</p>
      </header>
      <ArticleList
        items={data.items}
        page={data.page}
        totalPages={data.totalPages}
        basePath="/latest"
      />
    </div>
  );
}
