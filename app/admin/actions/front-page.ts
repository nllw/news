"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import { listPublishedForPicker } from "@/lib/data/admin-articles";

export interface PickerArticle {
  id: string;
  headline: string;
  section: string;
  author: string;
  publishedAt: string | null;
  thumbUrl: string | null;
}

export async function searchPublishedAction(q: string): Promise<ActionResult<PickerArticle[]>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const rows = await listPublishedForPicker(q, 25);
    return ok(
      rows.map((r) => ({
        id: r.id,
        headline: r.headline,
        section: r.section.name,
        author: r.author.name,
        publishedAt: r.publishedAt?.toISOString() ?? null,
        thumbUrl: r.featuredImage?.thumbUrl ?? r.featuredImage?.url ?? null,
      }))
    );
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    console.error(err);
    return fail("Could not search articles.");
  }
}
