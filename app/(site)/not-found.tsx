import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { SearchForm } from "@/components/SearchForm";
import { SectionHeading } from "@/components/SectionHeading";
import { getLatestPage } from "@/lib/data/articles";

export default async function NotFound() {
  const latest = await getLatestPage(1).catch(() => null);
  return (
    <div className="container py-16">
      <div className="mx-auto max-w-xl text-center">
        <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-wire-text">
          404
        </p>
        <h1 className="mt-2 text-balance font-display text-4xl font-bold md:text-5xl">
          This page could not be found.
        </h1>
        <p className="mt-4 font-body text-lg text-muted">
          It may have moved or been removed. Try a search, or start from the{" "}
          <Link href="/" className="underline hover:text-ink">
            front page
          </Link>
          .
        </p>
        <SearchForm size="lg" className="mt-6" />
      </div>
      {latest && latest.items.length > 0 ? (
        <section aria-labelledby="latest-404" className="mt-16">
          <SectionHeading title="Latest stories" id="latest-404" href="/latest" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {latest.items.slice(0, 4).map((a) => (
              <ArticleCard key={a.id} article={a} showDek={false} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
