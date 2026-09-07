import type { Metadata } from "next";
import { Rss } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Follow",
  description: "Get new stories delivered to your feed reader.",
  alternates: { canonical: `${siteUrl}/feed` },
};

const READERS = [
  { name: "Feedly", href: "https://feedly.com" },
  { name: "Inoreader", href: "https://www.inoreader.com" },
  { name: "NetNewsWire", href: "https://netnewswire.com" },
  { name: "Reeder", href: "https://reederapp.com" },
];

export default async function FeedPage() {
  const settings = await getSettings();
  const feedUrl = `${siteUrl}/feed.xml`;

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-wire-text">
          Follow
        </p>
        <h1 className="mt-1 text-balance font-display text-4xl font-bold md:text-5xl">
          Get every story as it publishes
        </h1>
        <p className="mt-4 text-pretty font-body text-lg leading-snug text-muted md:text-xl">
          {settings.siteName} publishes an RSS feed. Add it to a feed reader and new stories arrive
          there automatically, with the headline, summary, and full text.
        </p>

        <section
          aria-labelledby="feed-address"
          className="mt-8 rounded-lg border border-rule bg-surface p-5"
        >
          <h2 id="feed-address" className="font-ui text-xs font-bold uppercase tracking-[0.12em]">
            Feed address
          </h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 select-all overflow-x-auto rounded border border-rule bg-paper px-3 py-2 font-mono text-sm">
              {feedUrl}
            </code>
            <CopyButton value={feedUrl} label="Copy address" />
          </div>
          <p className="mt-3 font-ui text-xs text-muted">
            Opening this address directly in a browser shows the raw feed data. That is normal. It
            is designed to be read by an app.
          </p>
        </section>

        <section aria-labelledby="how-to" className="mt-8">
          <h2 id="how-to" className="font-ui text-xs font-bold uppercase tracking-[0.12em]">
            How to subscribe
          </h2>
          <ol className="mt-3 space-y-3 font-body text-lg">
            <li className="flex gap-3">
              <span
                className="font-display text-2xl font-bold leading-none text-rule"
                aria-hidden="true"
              >
                1
              </span>
              <span>
                Pick a feed reader. Popular choices:{" "}
                {READERS.map((r, i) => (
                  <span key={r.name}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-[3px] hover:text-wire-text"
                    >
                      {r.name}
                    </a>
                    {i < READERS.length - 1 ? ", " : "."}
                  </span>
                ))}
              </span>
            </li>
            <li className="flex gap-3">
              <span
                className="font-display text-2xl font-bold leading-none text-rule"
                aria-hidden="true"
              >
                2
              </span>
              <span>Choose “Add feed” or “Subscribe” in the app and paste the address above.</span>
            </li>
            <li className="flex gap-3">
              <span
                className="font-display text-2xl font-bold leading-none text-rule"
                aria-hidden="true"
              >
                3
              </span>
              <span>New stories appear in the app within a few minutes of publishing.</span>
            </li>
          </ol>
        </section>

        <p className="mt-8 font-ui text-sm text-muted">
          Prefer the raw feed?{" "}
          <a
            href="/feed.xml"
            className="inline-flex items-center gap-1 underline underline-offset-[3px] hover:text-ink"
          >
            <Rss className="h-3.5 w-3.5" aria-hidden="true" /> Open feed.xml
          </a>
        </p>
      </div>
    </div>
  );
}
