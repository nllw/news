"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactHeaderProps {
  siteName: string;
  sections: { name: string; slug: string }[];
}

/**
 * A slim bar that appears once the reader scrolls past the masthead.
 * The sentinel sits directly below the full header in SiteHeader.
 */
export function CompactHeader({ siteName, sections }: CompactHeaderProps) {
  const [visible, setVisible] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      rootMargin: "-1px 0px 0px 0px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      <div
        data-compact-header
        className={cn(
          "fixed inset-x-0 top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur transition-transform duration-200 motion-reduce:transition-none",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
        aria-hidden={!visible}
      >
        <div className="container flex h-12 items-center gap-4">
          <Link
            href="/"
            className="shrink-0 font-display text-xl font-black tracking-tight"
            tabIndex={visible ? 0 : -1}
          >
            {siteName}
          </Link>
          <ul className="flex flex-1 items-center gap-x-5 overflow-x-auto font-ui text-xs font-semibold uppercase tracking-wide [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sections.map((s) => (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={`/section/${s.slug}`}
                  className="hover:text-wire-text"
                  tabIndex={visible ? 0 : -1}
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/search"
            aria-label="Search"
            tabIndex={visible ? 0 : -1}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-ink/10"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </>
  );
}
