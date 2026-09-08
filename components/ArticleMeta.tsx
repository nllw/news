import Link from "next/link";
import { formatDate, formatDateTime, readingTimeLabel, toIso } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ArticleMetaProps {
  author: { name: string; slug: string };
  publishedAt: Date | string | null;
  updatedAt?: Date | string | null;
  readingTime?: number;
  variant?: "full" | "compact";
  className?: string;
}

const ONE_HOUR = 60 * 60 * 1000;

export function ArticleMeta({
  author,
  publishedAt,
  updatedAt,
  readingTime,
  variant = "full",
  className,
}: ArticleMetaProps) {
  const published = publishedAt ? new Date(publishedAt) : null;
  const updated = updatedAt ? new Date(updatedAt) : null;
  const showUpdated = published && updated && updated.getTime() - published.getTime() > ONE_HOUR;

  if (variant === "compact") {
    return (
      <p className={cn("font-ui text-xs text-muted", className)}>
        <span>By </span>
        <Link
          href={`/author/${author.slug}`}
          className="relative z-10 font-medium text-ink hover:underline"
        >
          {author.name}
        </Link>
        {published ? (
          <>
            <span aria-hidden="true"> · </span>
            <time dateTime={toIso(published)}>{formatDate(published, "MMM d, yyyy")}</time>
          </>
        ) : null}
      </p>
    );
  }

  return (
    <div className={cn("font-ui text-sm text-muted", className)}>
      <p>
        <span>By </span>
        <Link href={`/author/${author.slug}`} className="font-semibold text-ink hover:underline">
          {author.name}
        </Link>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        {published ? (
          <time dateTime={toIso(published)}>{formatDateTime(published)}</time>
        ) : (
          <span>Unpublished</span>
        )}
        {showUpdated ? (
          <>
            <span aria-hidden="true">·</span>
            <span>
              Updated <time dateTime={toIso(updated)}>{formatDateTime(updated)}</time>
            </span>
          </>
        ) : null}
        {readingTime ? (
          <>
            <span aria-hidden="true">·</span>
            <span>{readingTimeLabel(readingTime)}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
