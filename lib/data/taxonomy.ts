import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug, makeSlug } from "@/lib/slug";
import type { AuthorInput, SectionInput, TagInput } from "@/lib/validation/taxonomy";
import { TAGS } from "./tags";

// ---------- Sections ----------

export const getSections = unstable_cache(
  () => prisma.section.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ["sections"],
  { tags: [TAGS.sections], revalidate: 300 }
);

export const listSectionsAdmin = () =>
  prisma.section.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });

export async function createSection(input: SectionInput) {
  const slug = await ensureUniqueSlug(input.slug ?? makeSlug(input.name, "section"), async (s) =>
    Boolean(await prisma.section.findUnique({ where: { slug: s } }))
  );
  return prisma.section.create({
    data: { name: input.name, slug, description: input.description || null, order: input.order },
  });
}

export async function updateSection(id: string, input: SectionInput) {
  const existing = await prisma.section.findUniqueOrThrow({ where: { id } });
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, async (s) =>
      Boolean(await prisma.section.findFirst({ where: { slug: s, id: { not: id } } }))
    );
  }
  return prisma.section.update({
    where: { id },
    data: { name: input.name, slug, description: input.description || null, order: input.order },
  });
}

export async function deleteSection(id: string) {
  const count = await prisma.article.count({ where: { sectionId: id } });
  if (count > 0) {
    throw new Error(
      `This section still has ${count} article${count === 1 ? "" : "s"}. Move them first.`
    );
  }
  return prisma.section.delete({ where: { id } });
}

// ---------- Tags ----------

export const listTags = () => prisma.tag.findMany({ orderBy: { name: "asc" } });

export const listTagsAdmin = () =>
  prisma.tag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

export async function createTag(input: TagInput) {
  const slug = await ensureUniqueSlug(input.slug ?? makeSlug(input.name, "tag"), async (s) =>
    Boolean(await prisma.tag.findUnique({ where: { slug: s } }))
  );
  return prisma.tag.create({ data: { name: input.name, slug } });
}

export async function findOrCreateTag(name: string) {
  const trimmed = name.trim();
  const slug = makeSlug(trimmed, "tag");
  const existing = await prisma.tag.findFirst({
    where: { OR: [{ slug }, { name: trimmed }] },
  });
  if (existing) return existing;
  return createTag({ name: trimmed });
}

export async function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}

// ---------- Authors ----------

export const listAuthors = () =>
  prisma.author.findMany({ orderBy: { name: "asc" }, include: { avatar: true } });

export const listAuthorsAdmin = () =>
  prisma.author.findMany({
    orderBy: { name: "asc" },
    include: {
      avatar: true,
      user: { select: { id: true, email: true } },
      _count: { select: { articles: true } },
    },
  });

export const getAuthorById = (id: string) =>
  prisma.author.findUnique({ where: { id }, include: { avatar: true } });

export async function createAuthor(input: AuthorInput) {
  const slug = await ensureUniqueSlug(input.slug ?? makeSlug(input.name, "author"), async (s) =>
    Boolean(await prisma.author.findUnique({ where: { slug: s } }))
  );
  return prisma.author.create({
    data: {
      name: input.name,
      slug,
      bio: input.bio || null,
      avatarId: input.avatarId,
      userId: input.userId,
    },
  });
}

export async function updateAuthor(id: string, input: AuthorInput) {
  const existing = await prisma.author.findUniqueOrThrow({ where: { id } });
  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, async (s) =>
      Boolean(await prisma.author.findFirst({ where: { slug: s, id: { not: id } } }))
    );
  }
  return prisma.author.update({
    where: { id },
    data: {
      name: input.name,
      slug,
      bio: input.bio || null,
      avatarId: input.avatarId,
      userId: input.userId,
    },
  });
}

export async function deleteAuthor(id: string) {
  const count = await prisma.article.count({ where: { authorId: id } });
  if (count > 0) {
    throw new Error(
      `This author still has ${count} article${count === 1 ? "" : "s"}. Reassign them first.`
    );
  }
  return prisma.author.delete({ where: { id } });
}
