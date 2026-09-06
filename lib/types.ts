export type Slot =
  | "hero"
  | "hero-secondary"
  | "sidebar"
  | "grid"
  | "unplaced";

export interface Article {
  id: string;
  slug: string;
  headline: string;
  dek: string; // subheadline / summary
  byline: string;
  section: string;
  imageUrl: string;
  imageCaption?: string;
  body: string; // paragraphs separated by \n\n
  slot: Slot;
  order: number; // controls ordering within a slot
  publishedAt: string; // ISO date
}

export type ArticleInput = Omit<Article, "id">;
