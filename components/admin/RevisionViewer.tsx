"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { diffWords } from "diff";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "./ConfirmDialog";
import { restoreRevisionAction } from "@/app/admin/actions/articles";
import { formatDateTime, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RevisionSnapshot } from "@/lib/data/admin-articles";

interface Revision {
  id: string;
  createdAt: string;
  by: string;
  snapshot: RevisionSnapshot;
}

interface Props {
  current: RevisionSnapshot & { updatedAt: string };
  revisions: Revision[];
}

function stripHtml(html: string) {
  return html
    .replace(/<\/(p|h2|h3|li|blockquote|figcaption)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function Diff({ from, to }: { from: string; to: string }) {
  const parts = useMemo(() => diffWords(from, to), [from, to]);
  if (from === to)
    return <p className="text-sm text-muted-ui-foreground">No changes in this field.</p>;
  return (
    <pre className="whitespace-pre-wrap font-body text-sm leading-relaxed">
      {parts.map((p, i) => (
        <span
          key={i}
          className={cn(
            p.added &&
              "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
            p.removed && "bg-red-100 text-red-900 line-through dark:bg-red-900/40 dark:text-red-200"
          )}
        >
          {p.value}
        </span>
      ))}
    </pre>
  );
}

export function RevisionViewer({ current, revisions }: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(revisions[0]?.id ?? null);
  const [confirm, setConfirm] = useState(false);
  const [, start] = useTransition();
  const selected = revisions.find((r) => r.id === selectedId) ?? null;

  if (revisions.length === 0) {
    return (
      <p className="text-sm text-muted-ui-foreground">
        No revisions yet. A snapshot is stored every time the article is saved.
      </p>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <ol
        className="max-h-[70vh] space-y-1 overflow-y-auto rounded-lg border bg-card p-2"
        aria-label="Revision history"
      >
        {revisions.map((r, i) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setSelectedId(r.id)}
              aria-current={r.id === selectedId ? "true" : undefined}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent",
                r.id === selectedId && "bg-accent"
              )}
            >
              <span className="block font-medium">
                {i === 0 ? "Previous save" : `${revisions.length - i} of ${revisions.length}`}
              </span>
              <span className="block text-xs text-muted-ui-foreground">
                {r.by} ·{" "}
                <time dateTime={r.createdAt} title={formatDateTime(r.createdAt)}>
                  {formatRelative(r.createdAt)}
                </time>
              </span>
            </button>
          </li>
        ))}
      </ol>

      {selected ? (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-card p-4">
            <div className="text-sm">
              <p className="font-medium">Snapshot from {formatDateTime(selected.createdAt)}</p>
              <p className="text-xs text-muted-ui-foreground">
                Compared with the current version (saved {formatRelative(current.updatedAt)}).
                Removed text is struck through, added text is highlighted.
              </p>
            </div>
            <Button variant="outline" onClick={() => setConfirm(true)}>
              <RotateCcw /> Restore this version
            </Button>
          </div>

          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-ui-foreground">
              Headline
            </h2>
            <Diff from={selected.snapshot.headline} to={current.headline} />
          </section>
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-ui-foreground">
              Dek
            </h2>
            <Diff from={selected.snapshot.dek} to={current.dek} />
          </section>
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-ui-foreground">
              Body
            </h2>
            <div className="rounded-lg border bg-card p-4">
              <Diff from={stripHtml(selected.snapshot.bodyHtml)} to={stripHtml(current.bodyHtml)} />
            </div>
          </section>

          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Restore this version?"
            description="The headline, dek, body, caption, and SEO fields are replaced with this snapshot. The current version is kept as a new revision so nothing is lost."
            confirmLabel="Restore"
            onConfirm={async () => {
              const res = await restoreRevisionAction(selected.id);
              if (res.ok) {
                toast.success("Version restored");
                start(() => router.push(`/admin/articles/${res.data.id}/edit`));
              } else toast.error(res.error ?? "Could not restore");
              setConfirm(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
