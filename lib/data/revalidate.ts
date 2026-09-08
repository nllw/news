import { revalidatePath, revalidateTag } from "next/cache";
import { TAGS } from "./tags";

interface ArticleLike {
  slug: string;
  section?: { slug: string } | null;
  author?: { slug: string } | null;
  tags?: { tag: { slug: string } }[];
}

/** Invalidate every cached page that could show this article. */
export function revalidateArticle(article: ArticleLike, previousSlug?: string | null) {
  revalidateTag(TAGS.frontPage);
  revalidateTag(TAGS.articles);
  revalidateTag(TAGS.article(article.slug));
  if (previousSlug && previousSlug !== article.slug) {
    revalidateTag(TAGS.article(previousSlug));
    revalidatePath(`/article/${previousSlug}`);
  }
  if (article.section) revalidateTag(TAGS.section(article.section.slug));
  if (article.author) revalidateTag(TAGS.author(article.author.slug));
  for (const t of article.tags ?? []) revalidateTag(TAGS.tag(t.tag.slug));
  revalidatePath(`/article/${article.slug}`);
  revalidatePath("/");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
}

export function revalidateFrontPage() {
  revalidateTag(TAGS.frontPage);
  revalidatePath("/");
}

export function revalidateTaxonomy() {
  revalidateTag(TAGS.sections);
  revalidateTag(TAGS.authors);
  revalidateTag(TAGS.tags);
  revalidateTag(TAGS.frontPage);
  revalidateTag(TAGS.articles);
  revalidatePath("/", "layout");
}

export function revalidateSettings() {
  revalidateTag(TAGS.settings);
  revalidatePath("/", "layout");
}
