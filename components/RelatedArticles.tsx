import type { ArticleSummary } from "@/lib/types";
import { ArticleCard } from "./ArticleCard";
import { SectionHeading } from "./SectionHeading";

export function RelatedArticles({
  articles,
  title = "Related stories",
}: {
  articles: ArticleSummary[];
  title?: string;
}) {
  if (articles.length === 0) return null;
  return (
    <section aria-labelledby="related-heading" className="mt-12">
      <SectionHeading title={title} id="related-heading" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} variant="standard" showDek={false} />
        ))}
      </div>
    </section>
  );
}
