"use server";

import { z } from "zod";
import { fail, fromZodError, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import {
  createArticle,
  deleteArticle,
  duplicateArticle,
  getArticleByIdAdmin,
  getRevision,
  placeArticle,
  saveFrontPageLayout,
  setStatus,
  updateArticle,
  parseSnapshot,
} from "@/lib/data/admin-articles";
import { revalidateArticle, revalidateFrontPage } from "@/lib/data/revalidate";
import { prepareArticle } from "@/lib/prepare-article";
import {
  articleInputSchema,
  frontPageLayoutSchema,
  placementSchema,
} from "@/lib/validation/article";

function handleError<T>(err: unknown): ActionResult<T> {
  if (err instanceof AuthError) return fail(err.message);
  console.error(err);
  return fail(err instanceof Error ? err.message : "Something went wrong.");
}

export async function createArticleAction(
  raw: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const parsed = articleInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const article = await createArticle(prepareArticle(parsed.data), user.id);
    revalidateArticle(article);
    return ok({ id: article.id, slug: article.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateArticleAction(
  id: string,
  raw: unknown
): Promise<ActionResult<{ id: string; slug: string; status: string; updatedAt: string }>> {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const parsed = articleInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const existing = await getArticleByIdAdmin(id);
    if (!existing) return fail("That article no longer exists.");
    const { article, previousSlug } = await updateArticle(id, prepareArticle(parsed.data), user.id);
    revalidateArticle(article, previousSlug);
    return ok({
      id: article.id,
      slug: article.slug,
      status: article.status,
      updatedAt: article.updatedAt.toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteArticleAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireRole("ADMIN");
    const removed = await deleteArticle(id);
    if (!removed) return fail("That article no longer exists.");
    revalidateArticle(removed);
    return ok({ id });
  } catch (err) {
    return handleError(err);
  }
}

const statusChangeSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED"]),
});

export async function setStatusAction(raw: unknown): Promise<ActionResult<{ count: number }>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = statusChangeSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const changed = await setStatus(parsed.data.ids, parsed.data.status);
    for (const a of changed) revalidateArticle(a);
    return ok({ count: changed.length });
  } catch (err) {
    return handleError(err);
  }
}

export async function duplicateArticleAction(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const copy = await duplicateArticle(id, user.id);
    return ok({ id: copy.id });
  } catch (err) {
    return handleError(err);
  }
}

export async function placeArticleAction(
  id: string,
  raw: unknown
): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = placementSchema.nullable().safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    await placeArticle(id, parsed.data);
    revalidateFrontPage();
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

export async function saveFrontPageLayoutAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = frontPageLayoutSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    await saveFrontPageLayout(parsed.data.placements);
    revalidateFrontPage();
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

export async function restoreRevisionAction(
  revisionId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireRole("ADMIN", "EDITOR");
    const revision = await getRevision(revisionId);
    if (!revision) return fail("That revision no longer exists.");
    const snap = parseSnapshot(revision.snapshot);
    const a = revision.article;
    const input = articleInputSchema.parse({
      headline: snap.headline,
      dek: snap.dek,
      slug: a.slug,
      bodyHtml: snap.bodyHtml,
      sectionId: a.sectionId,
      authorId: a.authorId,
      tagIds: a.tags.map((t) => t.tagId),
      featuredImageId: a.featuredImageId,
      featuredImageCaption: snap.featuredImageCaption,
      status: a.status,
      publishedAt: a.publishedAt,
      scheduledFor: a.scheduledFor,
      seoTitle: snap.seoTitle,
      seoDescription: snap.seoDescription,
      canonicalUrl: a.canonicalUrl,
      placement: a.placement ? { slot: a.placement.slot, order: a.placement.order } : null,
    });
    const { article } = await updateArticle(a.id, prepareArticle(input), user.id);
    revalidateArticle(article);
    return ok({ id: article.id });
  } catch (err) {
    return handleError(err);
  }
}
