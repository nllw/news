import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";

export function ArticleCard({
  article,
  compact = false,
  textOnly = false
}: {
  article: Article;
  compact?: boolean;
  textOnly?: boolean;
}) {
  if (textOnly) {
    return (
      <Link href={`/article/${article.slug}`} className="group block">
        <p className="text-[11px] font-ui font-semibold uppercase tracking-wide text-wire mb-1">
          {article.section}
        </p>
        <h3 className="font-display font-700 text-lg leading-tight group-hover:underline">
          {article.headline}
        </h3>
      </Link>
    );
  }

  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <div
        className={`flex ${compact ? "flex-row-reverse gap-3 items-start" : "flex-col"}`}
      >
        <div
          className={`relative overflow-hidden bg-rule shrink-0 ${
            compact ? "w-24 aspect-[4/3]" : "w-full aspect-[4/3] mb-2"
          }`}
        >
          <Image
            src={article.imageUrl}
            alt={article.headline}
            fill
            sizes={compact ? "96px" : "(max-width: 768px) 100vw, 25vw"}
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-ui font-semibold uppercase tracking-wide text-wire mb-1">
            {article.section}
          </p>
          <h3
            className={`font-display font-700 leading-tight group-hover:underline ${
              compact ? "text-sm" : "text-lg"
            }`}
          >
            {article.headline}
          </h3>
          {!compact && (
            <p className="text-sm text-muted mt-1 leading-snug font-body">
              {article.dek}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}