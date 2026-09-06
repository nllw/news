import Masthead from "@/components/Masthead";
import { HeroStory } from "@/components/HeroStory";
import { ArticleCard } from "@/components/ArticleCard";
import { getArticlesBySlot } from "@/lib/db";

export const dynamic = "force-dynamic";

export default function FrontPage() {
  const hero = getArticlesBySlot("hero")[0];
  const bigThree = getArticlesBySlot("hero-secondary");
  const sidebar = getArticlesBySlot("sidebar");
  const grid = getArticlesBySlot("grid");

  return (
    <main>
      <Masthead />

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Lead package: hero + text-only "big three" column */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b-2 border-ink">
          <div className="md:col-span-2">
            {hero ? <HeroStory article={hero} /> : <EmptySlot label="hero" />}
          </div>

          <aside className="md:pl-6 md:border-l border-rule divide-y divide-rule">
            {bigThree.length === 0 && <EmptySlot label="hero-secondary" />}
            {bigThree.map((a) => (
              <div key={a.id} className="py-4 first:pt-0">
                <ArticleCard article={a} textOnly />
              </div>
            ))}
          </aside>
        </section>

        {/* Sidebar articles as a horizontal thumbnail strip */}
        {sidebar.length > 0 && (
          <section className="py-6 border-b border-rule">
            <p className="font-ui text-[11px] font-semibold uppercase tracking-wide text-muted mb-4">
              Also Reading
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4">
              {sidebar.map((a) => (
                <ArticleCard key={a.id} article={a} compact />
              ))}
            </div>
          </section>
        )}

        {/* Dense grid of remaining stories */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-8 pt-8">
          {grid.length === 0 && <EmptySlot label="grid" />}
          {grid.map((a) => (
            <ArticleCard key={a.id} article={a} />
          ))}
        </section>
      </div>

      <footer className="border-t border-ink mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs font-ui text-muted">
          <a href="/admin" className="hover:text-ink underline">
            Editor
          </a>
        </div>
      </footer>
    </main>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-rule p-6 text-center text-sm text-muted font-ui col-span-full">
      No story placed in the &ldquo;{label}&rdquo; slot yet. Add one from the
      editor.
    </div>
  );
}