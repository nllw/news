import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import { getArticleBySlug } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function ArticlePage({
  params
}: {
  params: { slug: string };
}) {
  const article = getArticleBySlug(params.slug);
  if (!article) notFound();

  const paragraphs = article.body.split("\n\n");
  const date = new Date(article.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <main>
      <Masthead />
      <article className="max-w-3xl mx-auto px-4 py-10">
        <Link
          href="/"
          className="text-xs font-ui uppercase tracking-wide text-muted hover:text-ink"
        >
          &larr; Front Page
        </Link>

        <p className="text-xs font-ui uppercase tracking-wide text-wire mt-6 mb-2">
          {article.section}
        </p>
        <h1 className="font-display font-900 text-4xl md:text-5xl leading-tight">
          {article.headline}
        </h1>
        <p className="font-body text-xl text-muted mt-3 leading-snug">
          {article.dek}
        </p>
        <p className="font-ui text-sm text-muted mt-4">
          {article.byline} &middot; {date}
        </p>

        <div className="relative aspect-[16/9] my-6 overflow-hidden bg-rule">
          <Image
            src={article.imageUrl}
            alt={article.headline}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
        {article.imageCaption && (
          <p className="text-xs font-ui text-muted -mt-4 mb-6">
            {article.imageCaption}
          </p>
        )}

        <div className="font-body text-lg leading-relaxed space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
        ))}
        </div>
      </article>
    </main>
  );
}
