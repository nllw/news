import { cn } from "@/lib/utils";

interface ArticleBodyProps {
  html: string;
  dropCap?: boolean;
  className?: string;
}

/**
 * Renders article HTML. The HTML is sanitised with a strict allowlist in
 * lib/sanitize.ts before it is ever stored, so this is the one place the
 * app injects markup.
 */
export function ArticleBody({ html, dropCap = true, className }: ArticleBodyProps) {
  return (
    <div
      className={cn("prose prose-news dark:prose-invert", dropCap && "dropcap", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
