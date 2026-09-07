import { htmlToText } from "@/lib/sanitize";

const WORDS_PER_MINUTE = 220;

export interface DerivedText {
  excerpt: string;
  wordCount: number;
  readingTime: number;
}

export function makeExcerpt(text: string, max = 200): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 80 ? lastSpace : max).trimEnd()}…`;
}

export function deriveText(bodyHtml: string, fallbackDek = ""): DerivedText {
  const text = htmlToText(bodyHtml);
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  return {
    excerpt: makeExcerpt(text || fallbackDek),
    wordCount: words,
    readingTime: Math.max(1, Math.ceil(words / WORDS_PER_MINUTE)),
  };
}

/** Escape text for embedding inside HTML. Used by the JSON importer. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Convert plain text with blank-line paragraph breaks to simple HTML. */
export function plainTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}
