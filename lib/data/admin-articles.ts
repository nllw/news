import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureUniqueSlug, makeSlug } from "@/lib/slug";
import {
  articleFullInclude,
  articleSummarySelect,
  SLOT_META,
  type ArticleFull,
  type Paginated,
  type Slot,
} from "@/lib/types";
import type { ArticleFilters, ArticleInput } from "@/lib/validation/article";
import { paginate } from "./published";

const MAX_REVISIONS = 20;

export interface PreparedArticle extends ArticleInput {
  excerpt: string;
  wordCount: number;
  readingTime: number;
}

export const getArticleByIdAdmin = (id: string): Promise<ArticleFull | null> =>
  prisma.article.findUnique({ where: { id }, include: articleFullInclude });

export type AdminArticleRow = Prisma.ArticleGetPayload<{ select: typeof adminRowSelect }>;

const adminRowSelect = {
  ...articleSummarySelect,
  createdAt: true,
  scheduledFor: true,
  placement: { select: { slot: true, order: true } },
} satisfies Prisma.ArticleSelect;

export async function listAdmin(filters: ArticleFilters): Promise<Paginated<AdminArticleRow>> {
  const where: Prisma.ArticleWhereInput = {};
  if (filters.status) where.status = filters.status;
  if (filters.sectionId) where.sectionId = filters.sectionId;
  if (filters.authorId) where.authorId = filters.authorId;
  if (filters.q) {
    where.OR = [
      { headline: { contains: filters.q } },
      { dek: { contains: filters.q } },
      { slug: { contains: filters.q } },
    ];
  }
  const orderBy: Prisma.ArticleOrderByWithRelationInput =
    filters.sort === "headline"
      ? { headline: filters.dir }
      : filters.sort === "published"
        ? { publishedAt: filters.dir }
        : { updatedAt: filters.dir };

  const { skip, take, page } = paginate(filters.page, filters.perPage);
  const [items, total] = await Promise.all([
    prisma.article.findMany({ where, orderBy, skip, take, select: adminRowSelect }),
    prisma.article.count({ where }),
  ]);
  return {
    items,
    page,
    perPage: filters.perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / filters.perPage)),
  };
}

export async function getDashboardStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [published, drafts, scheduled, archived, thisWeek, recentRevisions, media] =
    await Promise.all([
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.article.count({ where: { status: "DRAFT" } }),
      prisma.article.count({ where: { status: "SCHEDULED" } }),
      prisma.article.count({ where: { status: "ARCHIVED" } }),
      prisma.article.count({ where: { status: "PUBLISHED", publishedAt: { gte: weekAgo } } }),
      prisma.revision.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          article: { select: { id: true, headline: true, slug: true, status: true } },
          createdBy: { select: { name: true, email: true } },
        },
      }),
      prisma.media.count(),
    ]);
  return { published, drafts, scheduled, archived, thisWeek, recentRevisions, media };
}

// ---------- Slug helpers ----------

async function slugTaken(candidate: string, excludeId?: string) {
  const [article, redirect] = await Promise.all([
    prisma.article.findFirst({
      where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
    }),
    prisma.slugRedirect.findFirst({
      where: { fromSlug: candidate, ...(excludeId ? { articleId: { not: excludeId } } : {}) },
    }),
  ]);
  return Boolean(article || redirect);
}

function resolvePublishedAt(
  input: ArticleInput,
  existing?: { publishedAt: Date | null; status: string }
) {
  if (input.status === "PUBLISHED") {
    // Keep the original publish date when re-saving a published article,
    // unless the editor set one explicitly.
    return input.publishedAt ?? existing?.publishedAt ?? new Date();
  }
  if (input.status === "SCHEDULED") return input.scheduledFor ?? input.publishedAt ?? null;
  return input.publishedAt ?? existing?.publishedAt ?? null;
}

function contentData(input: PreparedArticle) {
  return {
    headline: input.headline,
    dek: input.dek,
    bodyHtml: input.bodyHtml,
    excerpt: input.excerpt,
    wordCount: input.wordCount,
    readingTime: input.readingTime,
    status: input.status,
    scheduledFor: input.status === "SCHEDULED" ? input.scheduledFor : null,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    canonicalUrl: input.canonicalUrl,
    sectionId: input.sectionId,
    authorId: input.authorId,
    featuredImageId: input.featuredImageId,
    featuredImageCaption: input.featuredImageCaption,
  };
}

// ---------- Mutations ----------

export async function createArticle(input: PreparedArticle, userId: string): Promise<ArticleFull> {
  const base = input.slug ?? makeSlug(input.headline);
  const slug = await ensureUniqueSlug(base, (s) => slugTaken(s));

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        ...contentData(input),
        slug,
        publishedAt: resolvePublishedAt(input),
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      },
    });
    if (input.placement) {
      await applyPlacement(tx, created.id, input.placement);
    }
    await tx.revision.create({
      data: {
        articleId: created.id,
        createdById: userId,
        snapshot: JSON.stringify(snapshotOf(input)),
      },
    });
    return tx.article.findUniqueOrThrow({ where: { id: created.id }, include: articleFullInclude });
  });
  return article;
}

export async function updateArticle(
  id: string,
  input: PreparedArticle,
  userId: string
): Promise<{ article: ArticleFull; previousSlug: string }> {
  const existing = await prisma.article.findUniqueOrThrow({
    where: { id },
    include: articleFullInclude,
  });

  let slug = existing.slug;
  if (input.slug && input.slug !== existing.slug) {
    slug = await ensureUniqueSlug(input.slug, (s) => slugTaken(s, id));
  }

  const article = await prisma.$transaction(async (tx) => {
    // Snapshot the previous content before overwriting
    await tx.revision.create({
      data: { articleId: id, createdById: userId, snapshot: JSON.stringify(snapshotOf(existing)) },
    });
    await pruneRevisions(tx, id);

    if (slug !== existing.slug) {
      const wasPublic = existing.status === "PUBLISHED" || existing.status === "SCHEDULED";
      if (wasPublic) {
        await tx.slugRedirect.upsert({
          where: { fromSlug: existing.slug },
          create: { fromSlug: existing.slug, articleId: id },
          update: { articleId: id },
        });
      }
      // The new slug is live again, so drop any redirect that pointed away from it
      await tx.slugRedirect.deleteMany({ where: { fromSlug: slug } });
    }

    await tx.articleTag.deleteMany({ where: { articleId: id } });
    await tx.article.update({
      where: { id },
      data: {
        ...contentData(input),
        slug,
        publishedAt: resolvePublishedAt(input, existing),
        tags: { create: input.tagIds.map((tagId) => ({ tagId })) },
      },
    });

    if (input.placement) {
      await applyPlacement(tx, id, input.placement);
    } else {
      await tx.placement.deleteMany({ where: { articleId: id } });
    }

    return tx.article.findUniqueOrThrow({ where: { id }, include: articleFullInclude });
  });

  return { article, previousSlug: existing.slug };
}

export async function deleteArticle(id: string): Promise<ArticleFull | null> {
  const existing = await prisma.article.findUnique({ where: { id }, include: articleFullInclude });
  if (!existing) return null;
  await prisma.article.delete({ where: { id } });
  return existing;
}

export async function setStatus(
  ids: string[],
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED"
): Promise<ArticleFull[]> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const id of ids) {
      const a = await tx.article.findUnique({ where: { id } });
      if (!a) continue;
      await tx.article.update({
        where: { id },
        data: {
          status,
          scheduledFor: null,
          publishedAt: status === "PUBLISHED" ? (a.publishedAt ?? now) : a.publishedAt,
        },
      });
      if (status !== "PUBLISHED") {
        await tx.placement.deleteMany({ where: { articleId: id } });
      }
    }
  });
  return prisma.article.findMany({ where: { id: { in: ids } }, include: articleFullInclude });
}

export async function duplicateArticle(id: string, userId: string): Promise<ArticleFull> {
  const src = await prisma.article.findUniqueOrThrow({ where: { id }, include: { tags: true } });
  const slug = await ensureUniqueSlug(`${src.slug}-copy`, (s) => slugTaken(s));
  const created = await prisma.article.create({
    data: {
      slug,
      headline: `${src.headline} (copy)`,
      dek: src.dek,
      bodyHtml: src.bodyHtml,
      excerpt: src.excerpt,
      wordCount: src.wordCount,
      readingTime: src.readingTime,
      status: "DRAFT",
      seoTitle: src.seoTitle,
      seoDescription: src.seoDescription,
      sectionId: src.sectionId,
      authorId: src.authorId,
      featuredImageId: src.featuredImageId,
      featuredImageCaption: src.featuredImageCaption,
      tags: { create: src.tags.map((t) => ({ tagId: t.tagId })) },
    },
  });
  await prisma.revision.create({
    data: { articleId: created.id, createdById: userId, snapshot: JSON.stringify(snapshotOf(src)) },
  });
  return prisma.article.findUniqueOrThrow({
    where: { id: created.id },
    include: articleFullInclude,
  });
}

/** Flip SCHEDULED articles whose time has passed to PUBLISHED. Returns the ones changed. */
export async function publishDueScheduled(): Promise<ArticleFull[]> {
  const now = new Date();
  const due = await prisma.article.findMany({
    where: { status: "SCHEDULED", scheduledFor: { lte: now } },
    include: articleFullInclude,
  });
  if (due.length === 0) return [];
  await prisma.article.updateMany({
    where: { id: { in: due.map((a) => a.id) } },
    data: { status: "PUBLISHED" },
  });
  return due;
}

// ---------- Placement ----------

type Tx = Prisma.TransactionClient;

async function applyPlacement(tx: Tx, articleId: string, placement: { slot: Slot; order: number }) {
  const capacity = SLOT_META[placement.slot].capacity;
  if (capacity !== null) {
    const others = await tx.placement.findMany({
      where: { slot: placement.slot, articleId: { not: articleId } },
      orderBy: { order: "asc" },
    });
    if (others.length >= capacity) {
      // Bump the oldest occupant out to keep within capacity
      const evict = others.slice(capacity - 1);
      await tx.placement.deleteMany({
        where: { articleId: { in: evict.map((p) => p.articleId) } },
      });
    }
  }
  await tx.placement.upsert({
    where: { articleId },
    create: { articleId, slot: placement.slot, order: placement.order },
    update: { slot: placement.slot, order: placement.order },
  });
}

export async function placeArticle(
  articleId: string,
  placement: { slot: Slot; order: number } | null
) {
  await prisma.$transaction(async (tx) => {
    if (placement) await applyPlacement(tx, articleId, placement);
    else await tx.placement.deleteMany({ where: { articleId } });
  });
}

/** Replace the whole front page layout atomically. */
export async function saveFrontPageLayout(
  placements: { articleId: string; slot: Slot; order: number }[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.placement.deleteMany({});
    for (const p of placements) {
      await tx.placement.create({ data: p });
    }
  });
}

export async function listPlacementsAdmin() {
  return prisma.placement.findMany({
    orderBy: [{ slot: "asc" }, { order: "asc" }],
    include: { article: { select: adminRowSelect } },
  });
}

export async function listPublishedForPicker(q: string, limit = 20) {
  const term = q.trim();
  return prisma.article.findMany({
    where: {
      status: "PUBLISHED",
      ...(term ? { headline: { contains: term } } : {}),
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: adminRowSelect,
  });
}

// ---------- Revisions ----------

export interface RevisionSnapshot {
  headline: string;
  dek: string;
  bodyHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  featuredImageCaption: string | null;
}

function snapshotOf(a: {
  headline: string;
  dek: string;
  bodyHtml: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  featuredImageCaption?: string | null;
}): RevisionSnapshot {
  return {
    headline: a.headline,
    dek: a.dek,
    bodyHtml: a.bodyHtml,
    seoTitle: a.seoTitle ?? null,
    seoDescription: a.seoDescription ?? null,
    featuredImageCaption: a.featuredImageCaption ?? null,
  };
}

async function pruneRevisions(tx: Tx, articleId: string) {
  const extra = await tx.revision.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
    skip: MAX_REVISIONS,
    select: { id: true },
  });
  if (extra.length) {
    await tx.revision.deleteMany({ where: { id: { in: extra.map((r) => r.id) } } });
  }
}

export async function listRevisions(articleId: string) {
  return prisma.revision.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
    include: { createdBy: { select: { name: true, email: true } } },
  });
}

export async function getRevision(id: string) {
  return prisma.revision.findUnique({
    where: { id },
    include: {
      article: { include: articleFullInclude },
      createdBy: { select: { name: true, email: true } },
    },
  });
}

export function parseSnapshot(json: string): RevisionSnapshot {
  try {
    return JSON.parse(json) as RevisionSnapshot;
  } catch {
    return {
      headline: "",
      dek: "",
      bodyHtml: "",
      seoTitle: null,
      seoDescription: null,
      featuredImageCaption: null,
    };
  }
}
