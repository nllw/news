import { beforeEach, describe, expect, it, vi } from "vitest";

// next/cache is unavailable outside a Next server; stub the pieces the data layer uses.
vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidateTag: () => undefined,
  revalidatePath: () => undefined,
}));

import { prisma } from "@/lib/prisma";
import {
  createArticle,
  deleteArticle,
  publishDueScheduled,
  saveFrontPageLayout,
  setStatus,
  updateArticle,
} from "@/lib/data/admin-articles";
import {
  getFrontPage,
  getPublishedArticleBySlug,
  resolveSlugRedirect,
  searchArticles,
} from "@/lib/data/articles";
import { prepareArticle } from "@/lib/prepare-article";
import { articleInputSchema } from "@/lib/validation/article";
import { baseInput, resetDb, seedBasics } from "./helpers";

function prep(input: Record<string, unknown>) {
  return prepareArticle(articleInputSchema.parse(input));
}

describe("article repository", () => {
  let ctx: Awaited<ReturnType<typeof seedBasics>>;

  beforeEach(async () => {
    await resetDb();
    ctx = await seedBasics();
  });

  it("creates an article with derived fields and a revision", async () => {
    const a = await createArticle(
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id })),
      ctx.user.id
    );
    expect(a.slug).toBe("a-headline-for-testing");
    expect(a.wordCount).toBeGreaterThan(5);
    expect(a.readingTime).toBe(1);
    expect(a.excerpt).toContain("Hello world");
    expect(a.publishedAt).not.toBeNull();
    expect(await prisma.revision.count({ where: { articleId: a.id } })).toBe(1);
  });

  it("makes slugs unique", async () => {
    const input = baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id });
    const a = await createArticle(prep(input), ctx.user.id);
    const b = await createArticle(prep(input), ctx.user.id);
    expect(a.slug).toBe("a-headline-for-testing");
    expect(b.slug).toBe("a-headline-for-testing-2");
  });

  it("adds a redirect when a published slug changes and resolves it", async () => {
    const a = await createArticle(
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id })),
      ctx.user.id
    );
    const { article } = await updateArticle(
      a.id,
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id, slug: "new-slug" })),
      ctx.user.id
    );
    expect(article.slug).toBe("new-slug");
    expect(await resolveSlugRedirect("a-headline-for-testing")).toBe("new-slug");
    expect(await getPublishedArticleBySlug("a-headline-for-testing")).toBeNull();
    expect((await getPublishedArticleBySlug("new-slug"))?.id).toBe(a.id);
  });

  it("hides drafts from public reads", async () => {
    await createArticle(
      prep(
        baseInput({
          sectionId: ctx.section.id,
          authorId: ctx.author.id,
          status: "DRAFT",
          slug: "draft",
        })
      ),
      ctx.user.id
    );
    expect(await getPublishedArticleBySlug("draft")).toBeNull();
    const search = await searchArticles("headline", 1);
    expect(search.total).toBe(0);
  });

  it("shows scheduled articles once their time has passed", async () => {
    const soon = new Date(Date.now() + 60_000);
    const a = await createArticle(
      prep(
        baseInput({
          sectionId: ctx.section.id,
          authorId: ctx.author.id,
          status: "SCHEDULED",
          scheduledFor: soon.toISOString(),
          slug: "sched",
        })
      ),
      ctx.user.id
    );
    expect(await getPublishedArticleBySlug("sched")).toBeNull();
    // Move the schedule into the past directly and check both the predicate and the sweep
    await prisma.article.update({
      where: { id: a.id },
      data: { scheduledFor: new Date(Date.now() - 1000) },
    });
    expect((await getPublishedArticleBySlug("sched"))?.id).toBe(a.id);
    const flipped = await publishDueScheduled();
    expect(flipped.map((x) => x.id)).toEqual([a.id]);
    expect((await prisma.article.findUnique({ where: { id: a.id } }))?.status).toBe("PUBLISHED");
  });

  it("groups placements on the front page and enforces hero capacity", async () => {
    const mk = (slug: string, placement: unknown) =>
      createArticle(
        prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id, slug, placement })),
        ctx.user.id
      );
    const h1 = await mk("hero-1", { slot: "hero", order: 0 });
    const h2 = await mk("hero-2", { slot: "hero", order: 0 });
    await mk("side-1", { slot: "sidebar", order: 1 });
    await mk("side-0", { slot: "sidebar", order: 0 });
    await mk("plain", null);

    const fp = await getFrontPage();
    expect(fp.hero?.slug).toBe("hero-2");
    expect(await prisma.placement.count({ where: { articleId: h1.id } })).toBe(0);
    expect(fp.sidebar.map((a) => a.slug)).toEqual(["side-0", "side-1"]);
    expect(fp.mostRecent.length).toBe(5);
    // Nothing was placed beside the lead, so the newest unused stories fill it
    expect(fp.secondary.map((a) => a.slug).sort()).toEqual(["hero-1", "plain"]);
    // Stories used beside the lead do not repeat in section blocks or the grid
    const secondaryIds = new Set(fp.secondary.map((a) => a.id));
    expect(fp.sections.every((b) => b.articles.every((a) => !secondaryIds.has(a.id)))).toBe(true);
    expect(fp.grid.every((a) => !secondaryIds.has(a.id))).toBe(true);
    expect(h2.placement?.slot).toBe("hero");
  });

  it("falls back to the newest story as the lead when none is placed", async () => {
    const mk = (slug: string, hoursAgo: number) =>
      createArticle(
        prep(
          baseInput({
            sectionId: ctx.section.id,
            authorId: ctx.author.id,
            slug,
            publishedAt: new Date(Date.now() - hoursAgo * 3600_000).toISOString(),
          })
        ),
        ctx.user.id
      );
    await mk("older", 5);
    await mk("newest", 1);
    await mk("middle", 3);
    const fp = await getFrontPage();
    expect(fp.hero?.slug).toBe("newest");
    expect(fp.secondary.map((a) => a.slug)).toEqual(["middle", "older"]);
  });

  it("saves a whole layout atomically", async () => {
    const a = await createArticle(
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id, slug: "a" })),
      ctx.user.id
    );
    const b = await createArticle(
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id, slug: "b" })),
      ctx.user.id
    );
    await saveFrontPageLayout([
      { articleId: b.id, slot: "hero", order: 0 },
      { articleId: a.id, slot: "grid", order: 0 },
    ]);
    const fp = await getFrontPage();
    expect(fp.hero?.id).toBe(b.id);
    expect(fp.grid[0].id).toBe(a.id);
  });

  it("unpublishing removes the placement", async () => {
    const a = await createArticle(
      prep(
        baseInput({
          sectionId: ctx.section.id,
          authorId: ctx.author.id,
          placement: { slot: "hero", order: 0 },
        })
      ),
      ctx.user.id
    );
    await setStatus([a.id], "DRAFT");
    expect(await prisma.placement.count()).toBe(0);
  });

  it("caps revisions at 20 per article", async () => {
    const a = await createArticle(
      prep(baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id })),
      ctx.user.id
    );
    for (let i = 0; i < 25; i++) {
      await updateArticle(
        a.id,
        prep(
          baseInput({ sectionId: ctx.section.id, authorId: ctx.author.id, headline: `Rev ${i}` })
        ),
        ctx.user.id
      );
    }
    expect(await prisma.revision.count({ where: { articleId: a.id } })).toBeLessThanOrEqual(20);
  });

  it("deletes cascade to placements, tags, and revisions", async () => {
    const tag = await prisma.tag.create({ data: { name: "T", slug: "t" } });
    const a = await createArticle(
      prep(
        baseInput({
          sectionId: ctx.section.id,
          authorId: ctx.author.id,
          tagIds: [tag.id],
          placement: { slot: "grid", order: 0 },
        })
      ),
      ctx.user.id
    );
    await deleteArticle(a.id);
    expect(await prisma.article.count()).toBe(0);
    expect(await prisma.placement.count()).toBe(0);
    expect(await prisma.articleTag.count()).toBe(0);
    expect(await prisma.revision.count()).toBe(0);
  });
});
