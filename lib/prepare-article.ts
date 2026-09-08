import { sanitizeArticleHtml } from "@/lib/sanitize";
import { deriveText } from "@/lib/derive-text";
import type { ArticleInput } from "@/lib/validation/article";
import type { PreparedArticle } from "@/lib/data/admin-articles";

/** Sanitise the body and compute derived fields. Shared by every article mutation. */
export function prepareArticle(input: ArticleInput): PreparedArticle {
  const bodyHtml = sanitizeArticleHtml(input.bodyHtml);
  const derived = deriveText(bodyHtml, input.dek);
  return { ...input, bodyHtml, ...derived };
}
