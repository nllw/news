"use server";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import { deleteMedia, updateMediaMeta } from "@/lib/data/media";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/data/tags";
import { mediaMetaSchema } from "@/lib/validation/media";

function handleError<T>(err: unknown): ActionResult<T> {
  if (err instanceof AuthError) return fail(err.message);
  console.error(err);
  return fail(err instanceof Error ? err.message : "Something went wrong.");
}

export async function updateMediaMetaAction(
  id: string,
  raw: unknown
): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = mediaMetaSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    await updateMediaMeta(id, parsed.data);
    revalidateTag(TAGS.articles);
    revalidateTag(TAGS.frontPage);
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteMediaAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const removed = await deleteMedia(id);
    if (!removed) return fail("That image no longer exists.");
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}
