import fs from "fs";
import path from "path";
import type { Article, ArticleInput } from "./types";

const DATA_PATH = path.join(process.cwd(), "data", "articles.json");

function readAll(): Article[] {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as Article[];
}

function writeAll(articles: Article[]) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(articles, null, 2), "utf-8");
}

function slugify(headline: string) {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function getAllArticles(): Article[] {
  return readAll().sort((a, b) => a.order - b.order);
}

export function getArticleById(id: string): Article | undefined {
  return readAll().find((a) => a.id === id);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return readAll().find((a) => a.slug === slug);
}

export function getArticlesBySlot(slot: Article["slot"]): Article[] {
  return readAll()
    .filter((a) => a.slot === slot)
    .sort((a, b) => a.order - b.order);
}

export function createArticle(input: ArticleInput): Article {
  const articles = readAll();
  const id = Date.now().toString();
  const slug = input.slug?.trim() ? input.slug : slugify(input.headline);
  const article: Article = { ...input, id, slug };
  articles.push(article);
  writeAll(articles);
  return article;
}

export function updateArticle(
  id: string,
  input: Partial<ArticleInput>
): Article | undefined {
  const articles = readAll();
  const idx = articles.findIndex((a) => a.id === id);
  if (idx === -1) return undefined;
  articles[idx] = { ...articles[idx], ...input };
  writeAll(articles);
  return articles[idx];
}

export function deleteArticle(id: string): boolean {
  const articles = readAll();
  const next = articles.filter((a) => a.id !== id);
  if (next.length === articles.length) return false;
  writeAll(next);
  return true;
}
