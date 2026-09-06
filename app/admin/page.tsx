import Link from "next/link";
import { getAllArticles } from "@/lib/db";
import { DeleteButton } from "./DeleteButton";

export const dynamic = "force-dynamic";

const SLOT_LABELS: Record<string, string> = {
  hero: "Hero (top story)",
  "hero-secondary": "Hero — secondary",
  sidebar: "Sidebar",
  grid: "Grid",
  unplaced: "Unplaced (not shown on front page)"
};

export default function AdminDashboard() {
  const articles = getAllArticles();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Articles</h1>
        <Link
          href="/admin/articles/new"
          className="bg-admin-accent text-white text-sm font-medium px-4 py-2 rounded-md hover:opacity-90"
        >
          + New article
        </Link>
      </div>

      {articles.length === 0 && (
        <p className="text-gray-500 text-sm">
          No articles yet. Create your first one to see it on the front page.
        </p>
      )}

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
        {articles.map((a) => (
          <div key={a.id} className="flex items-center justify-between px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-admin-accent font-medium">
                {SLOT_LABELS[a.slot] ?? a.slot} &middot; {a.section}
              </p>
              <p className="font-medium truncate">{a.headline}</p>
              <p className="text-xs text-gray-500">{a.byline}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-4">
              <Link
                href={`/article/${a.slug}`}
                target="_blank"
                className="text-sm text-gray-500 hover:text-admin-ink"
              >
                View
              </Link>
              <Link
                href={`/admin/articles/${a.id}/edit`}
                className="text-sm text-admin-accent hover:underline"
              >
                Edit
              </Link>
              <DeleteButton id={a.id} headline={a.headline} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
