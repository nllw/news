import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/db";
import { ArticleForm } from "@/app/admin/ArticleForm";

export const dynamic = "force-dynamic";

export default function EditArticlePage({
  params
}: {
  params: { id: string };
}) {
  const article = getArticleById(params.id);
  if (!article) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Edit article</h1>
      <ArticleForm initial={article} />
    </div>
  );
}
