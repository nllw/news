import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { ArticlesTable } from "@/components/admin/ArticlesTable";
import { ArticleFiltersBar } from "@/components/admin/ArticleFiltersBar";
import { Button } from "@/components/ui/button";
import { listAdmin } from "@/lib/data/admin-articles";
import { listAuthors, listSectionsAdmin } from "@/lib/data/taxonomy";
import { articleFiltersSchema } from "@/lib/validation/article";
import { requirePageUser } from "@/lib/auth-guards";

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const user = await requirePageUser();
  const parsed = articleFiltersSchema.safeParse(searchParams);
  const filters = parsed.success ? parsed.data : articleFiltersSchema.parse({});
  const [result, sections, authors] = await Promise.all([
    listAdmin(filters),
    listSectionsAdmin(),
    listAuthors(),
  ]);

  return (
    <>
      <PageHeader
        title="Articles"
        description={`${result.total} article${result.total === 1 ? "" : "s"}`}
      >
        <Button asChild>
          <Link href="/admin/articles/new">
            <FilePlus2 /> New article
          </Link>
        </Button>
      </PageHeader>
      <ArticleFiltersBar
        filters={filters}
        sections={sections.map((s) => ({ id: s.id, name: s.name }))}
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
      />
      <ArticlesTable
        rows={result.items.map((r) => ({
          ...r,
          publishedAt: r.publishedAt?.toISOString() ?? null,
          updatedAt: r.updatedAt.toISOString(),
          createdAt: r.createdAt.toISOString(),
          scheduledFor: r.scheduledFor?.toISOString() ?? null,
        }))}
        page={result.page}
        totalPages={result.totalPages}
        canDelete={user.role === "ADMIN"}
        filters={filters}
      />
    </>
  );
}
