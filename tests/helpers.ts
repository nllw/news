import { prisma } from "@/lib/prisma";

export async function resetDb() {
  await prisma.$transaction([
    prisma.revision.deleteMany(),
    prisma.slugRedirect.deleteMany(),
    prisma.placement.deleteMany(),
    prisma.articleTag.deleteMany(),
    prisma.article.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.media.deleteMany(),
    prisma.author.deleteMany(),
    prisma.section.deleteMany(),
    prisma.siteSetting.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export async function seedBasics() {
  const user = await prisma.user.create({
    data: { email: "editor@example.com", name: "Test Editor", role: "ADMIN", passwordHash: "x" },
  });
  const author = await prisma.author.create({
    data: { name: "Test Editor", slug: "test-editor", userId: user.id },
  });
  const section = await prisma.section.create({
    data: { name: "Politics", slug: "politics", order: 1 },
  });
  const section2 = await prisma.section.create({
    data: { name: "World", slug: "world", order: 2 },
  });
  return { user, author, section, section2 };
}

export function baseInput(overrides: Record<string, unknown> = {}) {
  return {
    headline: "A headline for testing",
    dek: "A short dek.",
    bodyHtml: "<p>Hello <strong>world</strong>. This is a body with several words in it.</p>",
    sectionId: "",
    authorId: "",
    tagIds: [],
    featuredImageId: null,
    featuredImageCaption: null,
    status: "PUBLISHED",
    publishedAt: null,
    scheduledFor: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    placement: null,
    ...overrides,
  };
}
