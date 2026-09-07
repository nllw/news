import Link from "next/link";
import { FilePlus2, LayoutTemplate, Upload } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardStats } from "@/lib/data/admin-articles";
import { formatDateTime, formatRelative } from "@/lib/format";
import { requirePageUser } from "@/lib/auth-guards";

export default async function AdminDashboard() {
  const [user, stats] = await Promise.all([requirePageUser(), getDashboardStats()]);
  const cards = [
    { label: "Published", value: stats.published, href: "/admin/articles?status=PUBLISHED" },
    { label: "Drafts", value: stats.drafts, href: "/admin/articles?status=DRAFT" },
    { label: "Scheduled", value: stats.scheduled, href: "/admin/articles?status=SCHEDULED" },
    {
      label: "Published this week",
      value: stats.thisWeek,
      href: "/admin/articles?status=PUBLISHED&sort=published",
    },
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here is where the newsroom stands today."
      >
        <Button asChild>
          <Link href="/admin/articles/new">
            <FilePlus2 /> New article
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border bg-card p-5 shadow-sm transition-colors hover:bg-accent/40"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-ui-foreground">
              {c.label}
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Latest saves across the newsroom.</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentRevisions.length === 0 ? (
              <p className="text-sm text-muted-ui-foreground">
                No activity yet. Create your first article to get started.
              </p>
            ) : (
              <ul className="divide-y">
                {stats.recentRevisions.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/articles/${r.article.id}/edit`}
                        className="line-clamp-1 font-medium hover:underline"
                      >
                        {r.article.headline || "Untitled"}
                      </Link>
                      <p className="text-xs text-muted-ui-foreground">
                        {r.createdBy?.name ?? r.createdBy?.email ?? "Someone"} ·{" "}
                        <time
                          dateTime={r.createdAt.toISOString()}
                          title={formatDateTime(r.createdAt)}
                        >
                          {formatRelative(r.createdAt)}
                        </time>
                      </p>
                    </div>
                    <StatusBadge status={r.article.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/articles/new">
                <FilePlus2 /> Write a new article
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/front-page">
                <LayoutTemplate /> Arrange the front page
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link href="/admin/media">
                <Upload /> Upload images
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-ui-foreground">
              {stats.media} image{stats.media === 1 ? "" : "s"} in the library · {stats.archived}{" "}
              archived article
              {stats.archived === 1 ? "" : "s"}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
