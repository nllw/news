import { PageHeader } from "@/components/admin/PageHeader";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";
import { requirePageUser } from "@/lib/auth-guards";
import { listAuthorsAdmin, listSectionsAdmin, listTagsAdmin } from "@/lib/data/taxonomy";
import { listUsers } from "@/lib/data/users";

export default async function TaxonomyPage() {
  const user = await requirePageUser();
  const [sections, tags, authors, users] = await Promise.all([
    listSectionsAdmin(),
    listTagsAdmin(),
    listAuthorsAdmin(),
    listUsers(),
  ]);
  return (
    <>
      <PageHeader
        title="Sections, authors & tags"
        description="The structure readers navigate by."
      />
      <TaxonomyManager
        isAdmin={user.role === "ADMIN"}
        sections={sections.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          description: s.description ?? "",
          order: s.order,
          count: s._count.articles,
        }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t._count.articles }))}
        authors={authors.map((a) => ({
          id: a.id,
          name: a.name,
          slug: a.slug,
          bio: a.bio ?? "",
          avatarId: a.avatarId,
          avatarUrl: a.avatar?.thumbUrl ?? a.avatar?.url ?? null,
          userId: a.userId,
          userEmail: a.user?.email ?? null,
          count: a._count.articles,
        }))}
        users={users.map((u) => ({ id: u.id, label: u.name ? `${u.name} (${u.email})` : u.email }))}
      />
    </>
  );
}
