import { listAllPublishedForSitemap } from "@/lib/data/articles";
import { getSettings } from "@/lib/data/settings";
import { siteUrl } from "@/lib/env";
import { escapeHtml } from "@/lib/derive-text";

export const revalidate = 300;

/** Google News sitemap: articles from the last 48 hours. */
export async function GET() {
  const [articles, settings] = await Promise.all([listAllPublishedForSitemap(), getSettings()]);
  const cutoff = Date.now() - 48 * 3600 * 1000;
  // Cached results are JSON, so dates arrive as strings on a cache hit; always coerce.
  const recent = articles
    .map((a) => ({ ...a, publishedAt: a.publishedAt ? new Date(a.publishedAt) : null }))
    .filter((a) => a.publishedAt && a.publishedAt.getTime() >= cutoff)
    .slice(0, 1000);

  const body = recent
    .map(
      (a) => `  <url>
    <loc>${siteUrl}/article/${a.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeHtml(settings.siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${a.publishedAt!.toISOString()}</news:publication_date>
      <news:title>${escapeHtml(a.headline)}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${body}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
