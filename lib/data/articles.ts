import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  articleFullInclude,
  articleSummarySelect,
  type ArticleFull,
  type ArticleSummary,
  type FrontPageData,
  type Paginated,
  type Slot,
  SLOT_META,
} from "@/lib/types";
import { paginate, publishedOrder, publishedWhere } from "./published";
import { TAGS } from "./tags";

const REVALIDATE = 60;
const PER_PAGE = 18;

// ---------- Front page ----------

async function loadFrontPage(): Promise<FrontPageData> {
  const now = new Date();
  const [placements, mostRecent, sections] = await Promise.all([
    prisma.placement.findMany({
      where: { article: publishedWhere(now) },
      orderBy: [{ slot: "asc" }, { order: "asc" }],
      include: { article: { select: articleSummarySelect } },
    }),
    prisma.article.findMany({
      where: publishedWhere(now),
      orderBy: publishedOrder,
      take: 6,
      select: articleSummarySelect,
    }),
    prisma.section.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }] }),
  ]);

  const bySlot = (slot: Slot) => placements.filter((p) => p.slot === slot).map((p) => p.article);
  // Every story already shown higher on the page. Grows as fallbacks are chosen so
  // nothing appears twice.
  const usedIds = new Set(placements.map((p) => p.articleId));

  /** Newest published stories not yet used on the page. */
  const newestUnused = (take: number) =>
    prisma.article.findMany({
      where: { ...publishedWhere(now), id: { notIn: [...usedIds] } },
      orderBy: publishedOrder,
      take,
      select: articleSummarySelect,
    });

  // Lead: the placed hero, or the newest story when nothing is placed.
  let hero = bySlot("hero")[0] ?? null;
  if (!hero) {
    hero = (await newestUnused(1))[0] ?? null;
    if (hero) usedIds.add(hero.id);
  }

  // Beside the lead: placed stories first, then the newest unused ones up to capacity,
  // so the column beside the lead is always full when enough stories exist.
  const secondaryCapacity = SLOT_META["hero-secondary"].capacity ?? 4;
  const secondary = bySlot("hero-secondary");
  if (secondary.length < secondaryCapacity) {
    const fill = await newestUnused(secondaryCapacity - secondary.length);
    for (const a of fill) {
      secondary.push(a);
      usedIds.add(a.id);
    }
  }

  const sidebar = bySlot("sidebar");

  const sectionBlocks = await Promise.all(
    sections.map(async (section) => ({
      section,
      articles: await prisma.article.findMany({
        where: { ...publishedWhere(now), sectionId: section.id, id: { notIn: [...usedIds] } },
        orderBy: publishedOrder,
        take: 4,
        select: articleSummarySelect,
      }),
    }))
  );

  // More stories: curated first, then the newest unused stories fill it out.
  const grid = bySlot("grid");
  const gridFill = grid.length >= 4 ? [] : await newestUnused(12 - grid.length);

  return {
    hero,
    secondary,
    sidebar,
    grid: [...grid, ...gridFill],
    mostRecent,
    sections: sectionBlocks.filter((b) => b.articles.length > 0),
  };
}

export const getFrontPage = unstable_cache(loadFrontPage, ["front-page"], {
  tags: [TAGS.frontPage, TAGS.articles, TAGS.sections],
  revalidate: REVALIDATE,
});

// ---------- Single article ----------

async function loadPublishedArticleBySlug(slug: string): Promise<ArticleFull | null> {
  const article = await prisma.article.findFirst({
    where: { slug, ...publishedWhere() },
    include: articleFullInclude,
  });
  return article;
}

export function getPublishedArticleBySlug(slug: string) {
  return unstable_cache(loadPublishedArticleBySlug, ["article", slug], {
    tags: [TAGS.article(slug), TAGS.articles],
    revalidate: REVALIDATE,
  })(slug);
}

export async function resolveSlugRedirect(slug: string): Promise<string | null> {
  const redirect = await prisma.slugRedirect.findUnique({
    where: { fromSlug: slug },
    include: { article: { select: { slug: true, status: true, scheduledFor: true } } },
  });
  if (!redirect) return null;
  return redirect.article.slug;
}

export async function getAdjacentArticles(article: { publishedAt: Date | null; id: string }) {
  if (!article.publishedAt) return { previous: null, next: null };
  const [previous, next] = await Promise.all([
    prisma.article.findFirst({
      where: {
        ...publishedWhere(),
        publishedAt: { lt: article.publishedAt },
        id: { not: article.id },
      },
      orderBy: { publishedAt: "desc" },
      select: articleSummarySelect,
    }),
    prisma.article.findFirst({
      where: {
        ...publishedWhere(),
        publishedAt: { gt: article.publishedAt },
        id: { not: article.id },
      },
      orderBy: { publishedAt: "asc" },
      select: articleSummarySelect,
    }),
  ]);
  return { previous, next };
}

export async function getRelatedArticles(
  article: { id: string; sectionId: string; tags: { tagId: string }[] },
  limit = 4
): Promise<ArticleSummary[]> {
  const tagIds = article.tags.map((t) => t.tagId);
  const byTag = tagIds.length
    ? await prisma.article.findMany({
        where: {
          ...publishedWhere(),
          id: { not: article.id },
          tags: { some: { tagId: { in: tagIds } } },
        },
        orderBy: publishedOrder,
        take: limit,
        select: articleSummarySelect,
      })
    : [];
  if (byTag.length >= limit) return byTag;
  const exclude = [article.id, ...byTag.map((a) => a.id)];
  const bySection = await prisma.article.findMany({
    where: { ...publishedWhere(), id: { notIn: exclude }, sectionId: article.sectionId },
    orderBy: publishedOrder,
    take: limit - byTag.length,
    select: articleSummarySelect,
  });
  return [...byTag, ...bySection];
}

// ---------- Lists ----------

async function loadList(
  where: Prisma.ArticleWhereInput,
  page: number,
  perPage = PER_PAGE
): Promise<Paginated<ArticleSummary>> {
  const { skip, take, page: safePage } = paginate(page, perPage);
  const [items, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy: publishedOrder,
      skip,
      take,
      select: articleSummarySelect,
    }),
    prisma.article.count({ where }),
  ]);
  return {
    items,
    page: safePage,
    perPage,
    total,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function getLatestPage(page: number) {
  return unstable_cache((p: number) => loadList(publishedWhere(), p), ["latest"], {
    tags: [TAGS.articles],
    revalidate: REVALIDATE,
  })(page);
}

export function getSectionPage(slug: string, page: number) {
  return unstable_cache(
    async (s: string, p: number) => {
      const section = await prisma.section.findUnique({ where: { slug: s } });
      if (!section) return null;
      const list = await loadList({ ...publishedWhere(), sectionId: section.id }, p);
      return { section, ...list };
    },
    ["section-page"],
    { tags: [TAGS.section(slug), TAGS.articles, TAGS.sections], revalidate: REVALIDATE }
  )(slug, page);
}

export function getAuthorPage(slug: string, page: number) {
  return unstable_cache(
    async (s: string, p: number) => {
      const author = await prisma.author.findUnique({
        where: { slug: s },
        include: { avatar: true },
      });
      if (!author) return null;
      const where = { ...publishedWhere(), authorId: author.id };
      const [list, first, sectionRows] = await Promise.all([
        loadList(where, p),
        prisma.article.findFirst({
          where,
          orderBy: { publishedAt: "asc" },
          select: { publishedAt: true },
        }),
        prisma.article.findMany({
          where,
          distinct: ["sectionId"],
          select: { section: { select: { name: true, slug: true } } },
        }),
      ]);
      const sectionsCovered = sectionRows
        .map((r) => r.section)
        .sort((a, b) => a.name.localeCompare(b.name));
      return { author, ...list, firstPublishedAt: first?.publishedAt ?? null, sectionsCovered };
    },
    ["author-page"],
    { tags: [TAGS.author(slug), TAGS.articles, TAGS.authors], revalidate: REVALIDATE }
  )(slug, page);
}

export function getTagPage(slug: string, page: number) {
  return unstable_cache(
    async (s: string, p: number) => {
      const tag = await prisma.tag.findUnique({ where: { slug: s } });
      if (!tag) return null;
      const list = await loadList({ ...publishedWhere(), tags: { some: { tagId: tag.id } } }, p);
      return { tag, ...list };
    },
    ["tag-page"],
    { tags: [TAGS.tag(slug), TAGS.articles, TAGS.tags], revalidate: REVALIDATE }
  )(slug, page);
}

/** Uncached. SQLite LIKE is case-insensitive for ASCII, which is adequate here. */
export async function searchArticles(q: string, page: number): Promise<Paginated<ArticleSummary>> {
  const term = q.trim().slice(0, 100);
  if (!term) return { items: [], page: 1, perPage: PER_PAGE, total: 0, totalPages: 1 };
  // publishedWhere() is itself an OR, so combine with AND rather than spreading
  return loadList(
    {
      AND: [
        publishedWhere(),
        {
          OR: [
            { headline: { contains: term } },
            { dek: { contains: term } },
            { excerpt: { contains: term } },
          ],
        },
      ],
    },
    page
  );
}

export const listRecentForFeed = unstable_cache(
  async (limit = 30) =>
    prisma.article.findMany({
      where: publishedWhere(),
      orderBy: publishedOrder,
      take: limit,
      include: articleFullInclude,
    }),
  ["feed"],
  { tags: [TAGS.articles], revalidate: 300 }
);

export const listAllPublishedForSitemap = unstable_cache(
  async () =>
    prisma.article.findMany({
      where: publishedWhere(),
      orderBy: publishedOrder,
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
        headline: true,
        section: { select: { name: true } },
      },
    }),
  ["sitemap-articles"],
  { tags: [TAGS.articles], revalidate: 300 }
);

export const listRecentSlugs = async (limit = 50) =>
  prisma.article.findMany({
    where: publishedWhere(),
    orderBy: publishedOrder,
    take: limit,
    select: { slug: true },
  });
