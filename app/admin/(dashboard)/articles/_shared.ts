import type { ArticleFull, ArticleStatus, Slot } from "@/lib/types";
import type { EditorArticle } from "@/components/admin/editor/types";
import { listAuthors, listSectionsAdmin, listTags } from "@/lib/data/taxonomy";
import { prisma } from "@/lib/prisma";

export async function editorOptions(userId: string) {
  const [sections, authors, tags, ownAuthor] = await Promise.all([
    listSectionsAdmin(),
    listAuthors(),
    listTags(),
    prisma.author.findUnique({ where: { userId }, select: { id: true } }),
  ]);
  return {
    sections: sections.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
    authors: authors.map((a) => ({ id: a.id, name: a.name, slug: a.slug })),
    tags: tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug })),
    defaultAuthorId: ownAuthor?.id,
  };
}

export function toEditorArticle(a: ArticleFull, revisionCount: number): EditorArticle {
  return {
    id: a.id,
    slug: a.slug,
    headline: a.headline,
    dek: a.dek,
    bodyHtml: a.bodyHtml,
    sectionId: a.sectionId,
    authorId: a.authorId,
    tagIds: a.tags.map((t) => t.tagId),
    featuredImage: a.featuredImage
      ? {
          id: a.featuredImage.id,
          url: a.featuredImage.url,
          thumbUrl: a.featuredImage.thumbUrl,
          alt: a.featuredImage.alt,
          credit: a.featuredImage.credit,
          width: a.featuredImage.width,
          height: a.featuredImage.height,
        }
      : null,
    featuredImageCaption: a.featuredImageCaption,
    status: a.status as ArticleStatus,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    scheduledFor: a.scheduledFor?.toISOString() ?? null,
    seoTitle: a.seoTitle,
    seoDescription: a.seoDescription,
    canonicalUrl: a.canonicalUrl,
    placement: a.placement ? { slot: a.placement.slot as Slot, order: a.placement.order } : null,
    updatedAt: a.updatedAt.toISOString(),
    revisionCount,
  };
}
