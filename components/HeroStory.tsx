import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/types";

export function HeroStory({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.slug}`} className="group block">
      <div className="relative aspect-[16/10] mb-3 overflow-hidden bg-rule">
        <Image
          src={article.imageUrl}
          alt={article.headline}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 66vw"
          className="object-cover"
        />
      </div>
      <p className="text-xs font-ui font-semibold uppercase tracking-wide text-wire mb-2">
        {article.section}
      </p>
      <h2 className="font-display font-800 text-3xl md:text-4xl leading-[1.05] tracking-tight group-hover:underline">
        {article.headline}
      </h2>
      <p className="font-body text-lg text-muted mt-2 leading-snug">
        {article.dek}
      </p>
      <p className="font-ui text-xs text-muted mt-2">{article.byline}</p>
    </Link>
  );
}