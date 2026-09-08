import type { ArticleSummary } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";
import { Pagination } from "./Pagination";

interface ArticleListProps {
  items: ArticleSummary[];
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
  emptyMessage?: string;
}

/** Standard index layout: first story wide, then a three-column grid. */
export function ArticleList({
  items,
  page,
  totalPages,
  basePath,
  query,
  emptyMessage = "No stories yet.",
}: ArticleListProps) {
  if (items.length === 0) {
    return <p className="py-16 text-center font-ui text-sm text-muted">{emptyMessage}</p>;
  }
  const [first, ...rest] = items;
  return (
    <>
      {page === 1 ? (
        <>
          <ArticleCard
            article={first}
            variant="wide"
            headingLevel={2}
            priority
            imageSizes="(max-width: 640px) 100vw, 40vw"
          />
          {rest.length > 0 ? <hr className="my-8 border-rule" /> : null}
          <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <ArticleCard key={a.id} article={a} variant="standard" headingLevel={2} />
            ))}
          </div>
        </>
      ) : (
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <ArticleCard key={a.id} article={a} variant="standard" headingLevel={2} />
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} basePath={basePath} query={query} />
    </>
  );
}
