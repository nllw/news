import type { Metadata } from "next";
import { ArticleCard } from "@/components/ArticleCard";
import { Pagination } from "@/components/Pagination";
import { SearchForm } from "@/components/SearchForm";
import { searchArticles } from "@/lib/data/articles";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const results = q ? await searchArticles(q, page) : null;

  return (
    <div className="container py-8">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl font-bold">Search</h1>
        <SearchForm defaultValue={q} size="lg" autoFocus={!q} className="mt-6" />
        {results ? (
          <p className="mt-4 font-ui text-sm text-muted" role="status">
            {results.total === 0
              ? `No results for “${q}”.`
              : `${results.total} result${results.total === 1 ? "" : "s"} for “${q}”`}
          </p>
        ) : (
          <p className="mt-4 font-ui text-sm text-muted">
            Search headlines and summaries across every published story.
          </p>
        )}
      </header>

      {results && results.items.length > 0 ? (
        <>
          <div className="mx-auto mt-10 max-w-3xl divide-y divide-rule">
            {results.items.map((a) => (
              <div key={a.id} className="py-6">
                <ArticleCard article={a} variant="list" headingLevel={2} />
              </div>
            ))}
          </div>
          <Pagination
            page={results.page}
            totalPages={results.totalPages}
            basePath="/search"
            query={{ q }}
          />
        </>
      ) : null}
    </div>
  );
}
