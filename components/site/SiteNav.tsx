import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SiteNavProps {
  sections: { name: string; slug: string }[];
  currentSection?: string;
}

export function SiteNav({ sections, currentSection }: SiteNavProps) {
  return (
    <nav aria-label="Sections" className="border-y border-ink bg-navbar text-navbar-text">
      <div className="container flex items-center">
        <ul className="flex flex-1 items-center gap-x-6 overflow-x-auto py-2.5 font-ui text-xs font-semibold uppercase tracking-wide [scrollbar-width:none] md:justify-center [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => {
            const active = s.slug === currentSection;
            return (
              <li key={s.slug} className="shrink-0">
                <Link
                  href={`/section/${s.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-block border-b-2 py-0.5 transition-colors hover:text-wire",
                    active ? "border-current" : "border-transparent"
                  )}
                >
                  {s.name}
                </Link>
              </li>
            );
          })}
        </ul>
        <Link
          href="/search"
          aria-label="Search"
          className="ml-4 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-navbar-text/15"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </nav>
  );
}
