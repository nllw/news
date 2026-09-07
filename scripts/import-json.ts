/* eslint-disable no-console */
/**
 * One-time import of the legacy data/articles.json store into the database.
 * Idempotent: articles are matched by slug and skipped if they already exist.
 *
 *   npm run import:json            # imports data/articles.json
 *   npm run import:json -- path.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

interface LegacyArticle {
  id?: string;
  slug?: string;
  headline: string;
  dek?: string;
  byline?: string;
  section?: string;
  imageUrl?: string;
  imageCaption?: string;
  body?: string;
  slot?: string;
  order?: number;
  publishedAt?: string;
}

async function main() {
  // Import lazily so env is loaded before lib/env validates it
  const { prisma } = await import("@/lib/prisma");
  const { makeSlug, ensureUniqueSlug } = await import("@/lib/slug");
  const { plainTextToHtml } = await import("@/lib/derive-text");
  const { prepareArticle } = await import("@/lib/prepare-article");
  const { articleInputSchema } = await import("@/lib/validation/article");
  const { processImageUpload } = await import("@/lib/images");
  const { SLOTS } = await import("@/lib/types");

  const file = path.resolve(process.cwd(), process.argv[2] ?? "data/articles.json");
  const raw = await fs.readFile(file, "utf-8");
  const legacy = JSON.parse(raw) as LegacyArticle[];
  console.log(`Read ${legacy.length} legacy article(s) from ${file}`);

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  });
  if (!admin) throw new Error("Run `npm run db:seed` first so an admin user exists.");

  let imported = 0;
  let skipped = 0;

  for (const item of legacy) {
    const headline = (item.headline ?? "").trim() || "Untitled";
    const baseSlug = item.slug?.trim() || makeSlug(headline);
    const existing = await prisma.article.findUnique({ where: { slug: baseSlug } });
    if (existing) {
      console.log(`skip  ${baseSlug} (already imported)`);
      skipped += 1;
      continue;
    }

    // Section
    const sectionName = (item.section ?? "").trim() || "News";
    const sectionSlug = makeSlug(sectionName, "section");
    const section =
      (await prisma.section.findFirst({
        where: { OR: [{ slug: sectionSlug }, { name: sectionName }] },
      })) ??
      (await prisma.section.create({ data: { name: sectionName, slug: sectionSlug, order: 999 } }));

    // Author from byline
    const authorName = (item.byline ?? "").replace(/^by\s+/i, "").trim() || "Staff";
    const authorSlug = makeSlug(authorName, "author");
    const author =
      (await prisma.author.findFirst({
        where: { OR: [{ slug: authorSlug }, { name: authorName }] },
      })) ?? (await prisma.author.create({ data: { name: authorName, slug: authorSlug } }));

    // Featured image: download and run through the upload pipeline
    let featuredImageId: string | null = null;
    if (item.imageUrl) {
      try {
        const res = await fetch(item.imageUrl, {
          headers: { "User-Agent": "broadsheet-import/1.0" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const type = res.headers.get("content-type")?.split(";")[0] ?? "image/jpeg";
        const buffer = Buffer.from(await res.arrayBuffer());
        const media = await processImageUpload({
          buffer,
          declaredType: type,
          alt: headline,
          caption: item.imageCaption,
          uploadedById: admin.id,
        });
        featuredImageId = media.id;
        console.log(`image ${baseSlug}: stored ${media.width}x${media.height}`);
      } catch (err) {
        console.warn(`image ${baseSlug}: skipped (${err instanceof Error ? err.message : err})`);
      }
    }

    const slug = await ensureUniqueSlug(baseSlug, async (s) =>
      Boolean(await prisma.article.findUnique({ where: { slug: s } }))
    );
    const placement =
      item.slot && (SLOTS as readonly string[]).includes(item.slot)
        ? { slot: item.slot, order: item.order ?? 0 }
        : null;
    const publishedAt =
      item.publishedAt && !Number.isNaN(Date.parse(item.publishedAt))
        ? new Date(item.publishedAt)
        : new Date();

    const input = articleInputSchema.parse({
      headline,
      dek: (item.dek ?? "").trim(),
      slug,
      bodyHtml: plainTextToHtml(item.body ?? ""),
      sectionId: section.id,
      authorId: author.id,
      tagIds: [],
      featuredImageId,
      featuredImageCaption: item.imageCaption?.trim() || null,
      status: "PUBLISHED",
      publishedAt: publishedAt > new Date() ? new Date() : publishedAt,
      scheduledFor: null,
      placement,
    });

    const prepared = prepareArticle(input);
    const created = await prisma.article.create({
      data: {
        slug,
        headline: prepared.headline,
        dek: prepared.dek,
        bodyHtml: prepared.bodyHtml,
        excerpt: prepared.excerpt,
        wordCount: prepared.wordCount,
        readingTime: prepared.readingTime,
        status: "PUBLISHED",
        publishedAt: prepared.publishedAt,
        sectionId: section.id,
        authorId: author.id,
        featuredImageId,
        featuredImageCaption: prepared.featuredImageCaption,
        ...(placement ? { placement: { create: placement } } : {}),
      },
    });
    await prisma.revision.create({
      data: {
        articleId: created.id,
        createdById: admin.id,
        snapshot: JSON.stringify({
          headline: created.headline,
          dek: created.dek,
          bodyHtml: created.bodyHtml,
          seoTitle: null,
          seoDescription: null,
          featuredImageCaption: created.featuredImageCaption,
        }),
      },
    });
    console.log(`ok    ${slug} (${prepared.wordCount} words, ${section.name}, by ${author.name})`);
    imported += 1;
  }

  console.log(`\nImported ${imported}, skipped ${skipped}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
