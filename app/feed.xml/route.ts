import { listRecentForFeed } from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { escapeHtml } from "@/lib/derive-text";

export const revalidate = 300;

export async function GET() {
  const [articles, settings] = await Promise.all([listRecentForFeed(30), getSettings()]);
  // Cached results are JSON, so dates arrive as strings on a cache hit; always coerce.
  const lastBuild = new Date(articles[0]?.publishedAt ?? Date.now());

  const items = articles
    .map((a) => {
      const url = `${siteUrl}/article/${a.slug}`;
      const pubDate = new Date(a.publishedAt ?? a.createdAt);
      const enclosure = a.featuredImage
        ? `\n      <enclosure url="${escapeHtml(a.featuredImage.url)}" type="${a.featuredImage.mimeType}" length="${a.featuredImage.sizeBytes}" />`
        : "";
      return `    <item>
      <title>${escapeHtml(a.headline)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate.toUTCString()}</pubDate>
      <dc:creator>${escapeHtml(a.author.name)}</dc:creator>
      <category>${escapeHtml(a.section.name)}</category>${a.tags.map((t) => `\n      <category>${escapeHtml(t.tag.name)}</category>`).join("")}
      <description>${escapeHtml(a.dek || a.excerpt)}</description>
      <content:encoded><![CDATA[${a.bodyHtml}]]></content:encoded>${enclosure}
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeHtml(settings.siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeHtml(settings.description)}</description>
    <language>en</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
