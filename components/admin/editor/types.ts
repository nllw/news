import type { ArticleStatus, Slot } from "@/lib/types";

export interface EditorOption {
  id: string;
  name: string;
  slug?: string;
}

export interface EditorMedia {
  id: string;
  url: string;
  thumbUrl: string | null;
  alt: string;
  credit: string | null;
  width: number;
  height: number;
}

/** What the form holds. Dates are datetime-local strings; converted on submit. */
export interface EditorValues {
  headline: string;
  dek: string;
  slug: string;
  slugLocked: boolean;
  bodyHtml: string;
  sectionId: string;
  authorId: string;
  tagIds: string[];
  featuredImage: EditorMedia | null;
  featuredImageCaption: string;
  status: ArticleStatus;
  publishedAt: string;
  scheduledFor: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  placementSlot: Slot | "";
  placementOrder: number;
}

export interface EditorArticle {
  id: string;
  slug: string;
  headline: string;
  dek: string;
  bodyHtml: string;
  sectionId: string;
  authorId: string;
  tagIds: string[];
  featuredImage: EditorMedia | null;
  featuredImageCaption: string | null;
  status: ArticleStatus;
  publishedAt: string | null;
  scheduledFor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  placement: { slot: Slot; order: number } | null;
  updatedAt: string;
  revisionCount: number;
}
