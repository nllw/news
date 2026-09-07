import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";
import { Kicker } from "./Kicker";
import { SafeImage } from "./SafeImage";
import { ArticleMeta } from "./ArticleMeta";

export function HeroStory({ article }: { article: ArticleSummary }) {
  const href = `/article/${article.slug}`;
  return (
    <article className="space-y-3">
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <SafeImage
          media={article.featuredImage}
          aspect="16/10"
          sizes="(max-width: 1024px) 100vw, 768px"
          priority
          decorative
        />
      </Link>
      <div className="space-y-2">
        <Kicker section={article.section} />
        <h2 className="text-balance font-display text-3xl font-bold leading-[1.05] text-ink md:text-[2.75rem]">
          <Link href={href} className="headline-link">
            {article.headline}
          </Link>
        </h2>
        {article.dek ? (
          <p className="max-w-2xl text-pretty font-body text-lg leading-snug text-muted md:text-xl">
            {article.dek}
          </p>
        ) : null}
        <ArticleMeta
          author={article.author}
          publishedAt={article.publishedAt}
          readingTime={article.readingTime}
          variant="compact"
        />
      </div>
    </article>
  );
}
