"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArticleFilters } from "@/lib/validation/article";
import { ARTICLE_STATUSES } from "@/lib/types";

interface Option {
  id: string;
  name: string;
}

interface Props {
  filters: ArticleFilters;
  sections: Option[];
  authors: Option[];
}

const ALL = "__all__";

export function ArticleFiltersBar({ filters, sections, authors }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(filters.q ?? "");

  useEffect(() => setQ(filters.q ?? ""), [filters.q]);

  function update(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === ALL) next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    router.push(`/admin/articles?${next.toString()}`);
  }

  const hasFilters = Boolean(filters.q || filters.status || filters.sectionId || filters.authorId);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <form
        className="relative min-w-[200px] flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: q.trim() || undefined });
        }}
        role="search"
      >
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ui-foreground"
          aria-hidden="true"
        />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search headlines…"
          className="pl-8"
          aria-label="Search articles"
        />
      </form>

      <Select value={filters.status ?? ALL} onValueChange={(v) => update({ status: v })}>
        <SelectTrigger className="w-[150px]" aria-label="Filter by status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {ARTICLE_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s[0] + s.slice(1).toLowerCase()}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.sectionId ?? ALL} onValueChange={(v) => update({ sectionId: v })}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by section">
          <SelectValue placeholder="Section" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All sections</SelectItem>
          {sections.map((s) => (
            <SelectItem key={s.id} value={s.id}>
              {s.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.authorId ?? ALL} onValueChange={(v) => update({ authorId: v })}>
        <SelectTrigger className="w-[160px]" aria-label="Filter by author">
          <SelectValue placeholder="Author" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All authors</SelectItem>
          {authors.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={`${filters.sort}:${filters.dir}`}
        onValueChange={(v) => {
          const [sort, dir] = v.split(":");
          update({ sort, dir });
        }}
      >
        <SelectTrigger className="w-[170px]" aria-label="Sort">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated:desc">Recently updated</SelectItem>
          <SelectItem value="published:desc">Recently published</SelectItem>
          <SelectItem value="published:asc">Oldest published</SelectItem>
          <SelectItem value="headline:asc">Headline A to Z</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/articles")}>
          <X /> Clear
        </Button>
      ) : null}
    </div>
  );
}
