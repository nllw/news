import type { Metadata } from "next";
import { ArticleEditor } from "@/components/admin/editor/ArticleEditor";
import { requirePageUser } from "@/lib/auth-guards";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { editorOptions } from "../_shared";

export const metadata: Metadata = { title: "New article" };

export default async function NewArticlePage() {
  const user = await requirePageUser();
  const [options, settings] = await Promise.all([editorOptions(user.id), getSettings()]);
  return (
    <ArticleEditor article={null} {...options} siteName={settings.siteName} siteUrl={siteUrl} />
  );
}
