import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { RevisionViewer } from "@/components/admin/RevisionViewer";
import { Button } from "@/components/ui/button";
import { requirePageUser } from "@/lib/auth-guards";
import { getArticleByIdAdmin, listRevisions, parseSnapshot } from "@/lib/data/admin-articles";

export const metadata: Metadata = { title: "Revisions" };

export default async function RevisionsPage({ params }: { params: { id: string } }) {
  await requirePageUser();
  const [article, revisions] = await Promise.all([
    getArticleByIdAdmin(params.id),
    listRevisions(params.id),
  ]);
  if (!article) notFound();

  return (
    <>
      <PageHeader title="Revisions" description={article.headline || "Untitled"}>
        <Button variant="outline" asChild>
          <Link href={`/admin/articles/${article.id}/edit`}>
            <ArrowLeft /> Back to editor
          </Link>
        </Button>
      </PageHeader>
      <RevisionViewer
        current={{
          headline: article.headline,
          dek: article.dek,
          bodyHtml: article.bodyHtml,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          featuredImageCaption: article.featuredImageCaption,
          updatedAt: article.updatedAt.toISOString(),
        }}
        revisions={revisions.map((r) => ({
          id: r.id,
          createdAt: r.createdAt.toISOString(),
          by: r.createdBy?.name ?? r.createdBy?.email ?? "Unknown",
          snapshot: parseSnapshot(r.snapshot),
        }))}
      />
    </>
  );
}
