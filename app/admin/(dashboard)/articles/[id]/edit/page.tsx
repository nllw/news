import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleEditor } from "@/components/admin/editor/ArticleEditor";
import { requirePageUser } from "@/lib/auth-guards";
import { getArticleByIdAdmin } from "@/lib/data/admin-articles";
import { getSettings } from "@/lib/data/settings";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/env";
import { editorOptions, toEditorArticle } from "../../_shared";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const a = await getArticleByIdAdmin(params.id);
  return { title: a ? `Edit: ${a.headline || "Untitled"}` : "Edit article" };
}

export default async function EditArticlePage({ params }: { params: { id: string } }) {
  const user = await requirePageUser();
  const [article, options, settings, revisionCount] = await Promise.all([
    getArticleByIdAdmin(params.id),
    editorOptions(user.id),
    getSettings(),
    prisma.revision.count({ where: { articleId: params.id } }),
  ]);
  if (!article) notFound();
  return (
    <ArticleEditor
      key={article.id + article.updatedAt.toISOString()}
      article={toEditorArticle(article, revisionCount)}
      {...options}
      siteName={settings.siteName}
      siteUrl={siteUrl}
    />
  );
}
