import type { Prisma } from "@prisma/client";

export const SLOTS = ["hero", "hero-secondary", "sidebar", "grid"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_META: Record<Slot, { label: string; help: string; capacity: number | null }> = {
  hero: { label: "Lead story", help: "The single lead story at the top of the page.", capacity: 1 },
  "hero-secondary": {
    label: "Beside the lead",
    help: "Text-only headlines beside the lead story. Empty spots fill with the newest stories automatically.",
    capacity: 4,
  },
  sidebar: {
    label: "Also reading",
    help: "Compact cards with thumbnails in the strip below the lead package.",
    capacity: 4,
  },
  grid: { label: "More stories", help: "Standard story cards in the grid.", capacity: null },
};

export const ARTICLE_STATUSES = ["DRAFT", "PUBLISHED", "SCHEDULED", "ARCHIVED"] as const;
export type ArticleStatus = (typeof ARTICLE_STATUSES)[number];

export const ROLES = ["ADMIN", "EDITOR"] as const;
export type Role = (typeof ROLES)[number];

/** Fields needed to render a card or list item. */
export const articleSummarySelect = {
  id: true,
  slug: true,
  headline: true,
  dek: true,
  excerpt: true,
  status: true,
  publishedAt: true,
  updatedAt: true,
  readingTime: true,
  featuredImageCaption: true,
  section: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, name: true, slug: true } },
  featuredImage: {
    select: {
      id: true,
      url: true,
      thumbUrl: true,
      alt: true,
      credit: true,
      width: true,
      height: true,
    },
  },
} satisfies Prisma.ArticleSelect;

export type ArticleSummary = Prisma.ArticleGetPayload<{ select: typeof articleSummarySelect }>;

/** Everything needed to render an article page or load the editor. */
export const articleFullInclude = {
  section: true,
  author: { include: { avatar: true } },
  featuredImage: true,
  tags: { include: { tag: true } },
  placement: true,
} satisfies Prisma.ArticleInclude;

export type ArticleFull = Prisma.ArticleGetPayload<{ include: typeof articleFullInclude }>;

export type MediaItem = Prisma.MediaGetPayload<{}>;
export type SectionItem = Prisma.SectionGetPayload<{}>;
export type TagItem = Prisma.TagGetPayload<{}>;
export type AuthorItem = Prisma.AuthorGetPayload<{ include: { avatar: true } }>;

export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface FrontPageData {
  hero: ArticleSummary | null;
  secondary: ArticleSummary[];
  sidebar: ArticleSummary[];
  grid: ArticleSummary[];
  mostRecent: ArticleSummary[];
  sections: { section: SectionItem; articles: ArticleSummary[] }[];
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  description: string;
  twitter: string;
  facebook: string;
  instagram: string;
  contactEmail: string;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  siteName: "The Washington Host",
  tagline: "Democracy Dies in Darkness",
  description: "Independent reporting on politics, business, culture, and the world.",
  twitter: "",
  facebook: "",
  instagram: "",
  contactEmail: "",
};
