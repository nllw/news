export const TAGS = {
  frontPage: "front-page",
  articles: "articles",
  sections: "sections",
  authors: "authors",
  tags: "tags",
  settings: "settings",
  article: (slug: string) => `article:${slug}`,
  section: (slug: string) => `section:${slug}`,
  author: (slug: string) => `author:${slug}`,
  tag: (slug: string) => `tag:${slug}`,
} as const;
