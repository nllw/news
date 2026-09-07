import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/PageHeader";
import { FrontPageBuilder } from "@/components/admin/FrontPageBuilder";
import { requirePageUser } from "@/lib/auth-guards";
import { listPlacementsAdmin } from "@/lib/data/admin-articles";
import type { Slot } from "@/lib/types";

export const metadata: Metadata = { title: "Front page" };

export default async function FrontPageAdmin() {
  await requirePageUser();
  const placements = await listPlacementsAdmin();
  return (
    <>
      <PageHeader
        title="Front page"
        description="Drag stories between slots. Only published stories can be placed. Changes go live when you save."
      />
      <FrontPageBuilder
        initial={placements.map((p) => ({
          slot: p.slot as Slot,
          order: p.order,
          article: {
            id: p.article.id,
            headline: p.article.headline,
            section: p.article.section.name,
            author: p.article.author.name,
            publishedAt: p.article.publishedAt?.toISOString() ?? null,
            thumbUrl: p.article.featuredImage?.thumbUrl ?? p.article.featuredImage?.url ?? null,
            status: p.article.status,
          },
        }))}
      />
    </>
  );
}
