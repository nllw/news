import Link from "next/link";
import { formatLongDate, toIso } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { ThemeToggle } from "@/components/ThemeToggle";

interface MastheadProps {
  settings: SiteSettings;
  isHome?: boolean;
}

export function Masthead({ settings, isHome = false }: MastheadProps) {
  const today = new Date();
  const Title = isHome ? "h1" : "p";
  return (
    <div className="container pt-3">
      <div className="flex items-center justify-between border-b border-rule pb-2 font-ui text-xs text-muted">
        <time dateTime={toIso(today).slice(0, 10)} suppressHydrationWarning>
          {formatLongDate(today)}
        </time>
        <div className="flex items-center gap-3">
          <Link
            href="/latest"
            className="font-semibold uppercase tracking-wide text-wire-text hover:underline"
          >
            Latest
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <Title className="text-balance py-4 text-center font-display text-5xl font-black leading-none tracking-tight text-ink md:py-5 md:text-7xl">
        <Link href="/" className="hover:text-ink/90">
          {settings.siteName}
        </Link>
      </Title>
      {settings.tagline ? (
        <p className="-mt-2 pb-3 text-center font-ui text-[11px] uppercase tracking-[0.25em] text-muted">
          {settings.tagline}
        </p>
      ) : null}
    </div>
  );
}
