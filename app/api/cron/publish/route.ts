import { NextResponse } from "next/server";
import { publishDueScheduled } from "@/lib/data/admin-articles";
import { revalidateArticle } from "@/lib/data/revalidate";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

/**
 * Flip scheduled articles to published once their time arrives. Scheduled
 * articles already appear on the public site when due (the published predicate
 * covers them), so this only keeps statuses tidy. Call it from any scheduler:
 *   curl -H "Authorization: Bearer $CRON_SECRET" https://example.com/api/cron/publish
 */
export async function GET(req: Request) {
  if (!env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }
  const header = req.headers.get("authorization") ?? "";
  if (header !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const changed = await publishDueScheduled();
  for (const a of changed) revalidateArticle(a);
  return NextResponse.json({ published: changed.map((a) => a.slug) });
}
