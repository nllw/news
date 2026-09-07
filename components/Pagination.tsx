import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  query?: Record<string, string | undefined>;
  className?: string;
}

function hrefFor(basePath: string, page: number, query?: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) params.set(k, v);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

function range(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("…");
    out.push(sorted[i]);
  }
  return out;
}

export function Pagination({ page, totalPages, basePath, query, className }: PaginationProps) {
  if (totalPages <= 1) return null;
  const link =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-full px-3 font-ui text-sm hover:bg-ink/10";
  return (
    <nav
      aria-label="Pagination"
      className={cn("mt-10 flex items-center justify-center gap-1", className)}
    >
      {page > 1 ? (
        <Link
          href={hrefFor(basePath, page - 1, query)}
          rel="prev"
          className={link}
          aria-label="Previous page"
          prefetch={false}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(link, "opacity-30")} aria-hidden="true">
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {range(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-2 font-ui text-sm text-muted">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, p, query)}
            aria-current={p === page ? "page" : undefined}
            className={cn(link, p === page && "bg-ink text-paper hover:bg-ink")}
            prefetch={false}
          >
            {p}
          </Link>
        )
      )}
      {page < totalPages ? (
        <Link
          href={hrefFor(basePath, page + 1, query)}
          rel="next"
          className={link}
          aria-label="Next page"
          prefetch={false}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span className={cn(link, "opacity-30")} aria-hidden="true">
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
