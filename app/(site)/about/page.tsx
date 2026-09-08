import type { Metadata } from "next";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "About",
  alternates: { canonical: `${siteUrl}/about` },
};

export default async function AboutPage() {
  const settings = await getSettings();
  return (
    <div className="container py-10">
      <article className="prose prose-news mx-auto max-w-2xl dark:prose-invert">
        <p className="font-ui text-[11px] font-semibold uppercase tracking-[0.15em] text-muted">
          About
        </p>
        <h1 className="font-display text-4xl font-bold">About {settings.siteName}</h1>
        {settings.description ? <p className="lead">{settings.description}</p> : null}
        <h2>Our approach</h2>
        <p>
          We report with care, attribute our sources, and correct our mistakes openly. Every story
          carries the name of the person who wrote it and the time it was published. When a story is
          updated after publication, the update time appears alongside the original.
        </p>
        <h2>Editorial independence</h2>
        <p>
          Our newsroom makes its own editorial decisions. Coverage choices, headlines, and placement
          on the front page are made by editors on the basis of public interest.
        </p>
        <h2>Corrections</h2>
        <p>
          If you believe something we published is inaccurate, please write to us through the{" "}
          <a href="/contact">contact page</a>. We review every request.
        </p>
      </article>
    </div>
  );
}
