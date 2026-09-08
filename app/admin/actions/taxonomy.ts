"use server";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import {
  createAuthor,
  createSection,
  createTag,
  deleteAuthor,
  deleteSection,
  deleteTag,
  findOrCreateTag,
  updateAuthor,
  updateSection,
} from "@/lib/data/taxonomy";
import { revalidateTaxonomy } from "@/lib/data/revalidate";
import { authorInputSchema, sectionInputSchema, tagInputSchema } from "@/lib/validation/taxonomy";

function handleError<T>(err: unknown): ActionResult<T> {
  if (err instanceof AuthError) return fail(err.message);
  console.error(err);
  return fail(err instanceof Error ? err.message : "Something went wrong.");
}

export interface OptionItem {
  id: string;
  name: string;
  slug: string;
}

// Sections (ADMIN)

export async function createSectionAction(raw: unknown): Promise<ActionResult<OptionItem>> {
  try {
    await requireRole("ADMIN");
    const parsed = sectionInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const s = await createSection(parsed.data);
    revalidateTaxonomy();
    return ok({ id: s.id, name: s.name, slug: s.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateSectionAction(
  id: string,
  raw: unknown
): Promise<ActionResult<OptionItem>> {
  try {
    await requireRole("ADMIN");
    const parsed = sectionInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const s = await updateSection(id, parsed.data);
    revalidateTaxonomy();
    return ok({ id: s.id, name: s.name, slug: s.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteSectionAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN");
    await deleteSection(id);
    revalidateTaxonomy();
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

// Tags (ADMIN, EDITOR)

export async function createTagAction(raw: unknown): Promise<ActionResult<OptionItem>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = tagInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const t = await findOrCreateTag(parsed.data.name);
    revalidateTaxonomy();
    return ok({ id: t.id, name: t.name, slug: t.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteTagAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN");
    await deleteTag(id);
    revalidateTaxonomy();
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

// Authors (ADMIN, EDITOR can create)

export async function createAuthorAction(raw: unknown): Promise<ActionResult<OptionItem>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const parsed = authorInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const a = await createAuthor(parsed.data);
    revalidateTaxonomy();
    return ok({ id: a.id, name: a.name, slug: a.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateAuthorAction(
  id: string,
  raw: unknown
): Promise<ActionResult<OptionItem>> {
  try {
    await requireRole("ADMIN");
    const parsed = authorInputSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const a = await updateAuthor(id, parsed.data);
    revalidateTaxonomy();
    return ok({ id: a.id, name: a.name, slug: a.slug });
  } catch (err) {
    return handleError(err);
  }
}

export async function deleteAuthorAction(id: string): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN");
    await deleteAuthor(id);
    revalidateTaxonomy();
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

// Re-exported so the editor can ensure a tag exists without a separate call
export { createTag };
