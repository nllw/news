import Link from "next/link";
import type { ArticleSummary } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Kicker } from "./Kicker";
import { SafeImage } from "./SafeImage";
import { ArticleMeta } from "./ArticleMeta";

export type CardVariant = "standard" | "compact" | "textOnly" | "wide" | "list";

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: CardVariant;
  headingLevel?: 2 | 3;
  showDek?: boolean;
  showMeta?: boolean;
  imageSizes?: string;
  priority?: boolean;
  className?: string;
}

export function ArticleCard({
  article,
  variant = "standard",
  headingLevel = 3,
  showDek,
  showMeta = true,
  imageSizes,
  priority,
  className,
}: ArticleCardProps) {
  const H = headingLevel === 2 ? "h2" : "h3";
  const href = `/article/${article.slug}`;
  const dekVisible =
    showDek ?? (variant === "standard" || variant === "wide" || variant === "list");

  const headline = (
    <H
      className={cn(
        "text-balance font-display font-bold leading-tight text-ink",
        variant === "wide" && "text-2xl md:text-3xl",
        variant === "standard" && "line-clamp-3 text-lg md:text-xl",
        variant === "compact" && "line-clamp-3 text-base",
        variant === "textOnly" && "line-clamp-3 text-xl md:text-[1.35rem]",
        variant === "list" && "text-xl md:text-2xl"
      )}
    >
      <Link href={href} className="headline-link">
        {article.headline}
      </Link>
    </H>
  );

  const dek =
    dekVisible && article.dek ? (
      <p
        className={cn(
          "text-pretty font-body text-muted",
          variant === "wide" || variant === "list"
            ? "text-lg leading-snug"
            : "line-clamp-2 text-[15px] leading-snug"
        )}
      >
        {article.dek}
      </p>
    ) : null;

  const meta = showMeta ? (
    <ArticleMeta
      author={article.author}
      publishedAt={article.publishedAt}
      readingTime={article.readingTime}
      variant="compact"
    />
  ) : null;

  if (variant === "textOnly") {
    return (
      <article className={cn("space-y-1.5", className)}>
        <Kicker section={article.section} />
        {headline}
        {dek}
        {meta}
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("flex gap-3", className)}>
        <div className="min-w-0 flex-1 space-y-1">
          <Kicker section={article.section} />
          {headline}
          {meta}
        </div>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="w-24 shrink-0 sm:w-28">
          <SafeImage media={article.featuredImage} aspect="1/1" sizes="112px" useThumb decorative />
        </Link>
      </article>
    );
  }

  if (variant === "wide" || variant === "list") {
    return (
      <article className={cn("grid gap-4 sm:grid-cols-5", className)}>
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden="true"
          className={cn("sm:col-span-2", variant === "list" && "sm:order-last")}
        >
          <SafeImage
            media={article.featuredImage}
            aspect="3/2"
            sizes={imageSizes ?? "(max-width: 640px) 100vw, 40vw"}
            priority={priority}
            decorative
          />
        </Link>
        <div className="space-y-2 sm:col-span-3">
          <Kicker section={article.section} />
          {headline}
          {dek}
          {meta}
        </div>
      </article>
    );
  }

  return (
    <article className={cn("space-y-2", className)}>
      <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
        <SafeImage
          media={article.featuredImage}
          aspect="3/2"
          sizes={imageSizes ?? "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"}
          priority={priority}
          decorative
        />
      </Link>
      <Kicker section={article.section} />
      {headline}
      {dek}
      {meta}
    </article>
  );
}
