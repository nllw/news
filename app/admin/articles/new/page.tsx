import { ArticleForm } from "@/app/admin/ArticleForm";

export default function NewArticlePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">New article</h1>
      <ArticleForm />
    </div>
  );
}
