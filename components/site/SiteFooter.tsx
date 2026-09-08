import Link from "next/link";
import { Facebook, Instagram, Rss, Twitter } from "lucide-react";
import type { SiteSettings } from "@/lib/types";

interface SiteFooterProps {
  settings: SiteSettings;
  sections: { name: string; slug: string }[];
}

export function SiteFooter({ settings, sections }: SiteFooterProps) {
  const year = new Date().getFullYear();
  const social = [
    settings.twitter && { href: settings.twitter, label: "X", Icon: Twitter },
    settings.facebook && { href: settings.facebook, label: "Facebook", Icon: Facebook },
    settings.instagram && { href: settings.instagram, label: "Instagram", Icon: Instagram },
  ].filter(Boolean) as { href: string; label: string; Icon: typeof Twitter }[];

  return (
    <footer className="mt-16 border-t-2 border-ink">
      <div className="container grid gap-10 py-10 font-ui text-sm md:grid-cols-4">
        <div className="md:col-span-1">
          <p className="font-display text-2xl font-black tracking-tight">{settings.siteName}</p>
          {settings.tagline ? (
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">{settings.tagline}</p>
          ) : null}
          {settings.description ? (
            <p className="mt-4 text-pretty text-muted">{settings.description}</p>
          ) : null}
        </div>

        <nav aria-label="Footer sections">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">Sections</h2>
          <ul className="space-y-1.5">
            {sections.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/section/${s.slug}`}
                  className="text-muted hover:text-ink hover:underline"
                  prefetch={false}
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="About">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">About</h2>
          <ul className="space-y-1.5">
            <li>
              <Link
                href="/about"
                className="text-muted hover:text-ink hover:underline"
                prefetch={false}
              >
                About us
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-muted hover:text-ink hover:underline"
                prefetch={false}
              >
                Contact
              </Link>
            </li>
            <li>
              <Link
                href="/latest"
                className="text-muted hover:text-ink hover:underline"
                prefetch={false}
              >
                All stories
              </Link>
            </li>
            <li>
              <Link
                href="/search"
                className="text-muted hover:text-ink hover:underline"
                prefetch={false}
              >
                Search
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wide">Follow</h2>
          <ul className="flex items-center gap-2">
            <li>
              <Link
                href="/feed"
                aria-label="Follow in your feed reader"
                title="Follow in your feed reader"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule hover:bg-ink hover:text-paper"
                prefetch={false}
              >
                <Rss className="h-4 w-4" aria-hidden="true" />
              </Link>
            </li>
            {social.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule hover:bg-ink hover:text-paper"
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-rule">
        <div className="container flex flex-wrap items-center justify-between gap-2 py-4 font-ui text-xs text-muted">
          <p>
            © {year} {settings.siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
