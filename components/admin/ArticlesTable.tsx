"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Archive,
  Copy,
  ExternalLink,
  Eye,
  History,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  deleteArticleAction,
  duplicateArticleAction,
  setStatusAction,
} from "@/app/admin/actions/articles";
import { formatDateTime, formatRelative } from "@/lib/format";
import { SLOT_META, type Slot } from "@/lib/types";
import type { ArticleFilters } from "@/lib/validation/article";

export interface ArticleRow {
  id: string;
  slug: string;
  headline: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  createdAt: string;
  scheduledFor: string | null;
  section: { id: string; name: string; slug: string };
  author: { id: string; name: string; slug: string };
  placement: { slot: string; order: number } | null;
}

interface Props {
  rows: ArticleRow[];
  page: number;
  totalPages: number;
  canDelete: boolean;
  filters: ArticleFilters;
}

export function ArticlesTable({ rows, page, totalPages, canDelete }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [selection, setSelection] = useState<RowSelectionState>({});
  const [pending, start] = useTransition();
  const [toDelete, setToDelete] = useState<ArticleRow | null>(null);

  const selectedIds = useMemo(
    () => rows.filter((r) => selection[r.id]).map((r) => r.id),
    [rows, selection]
  );

  const run = useCallback(
    (label: string, fn: () => Promise<{ ok: boolean; error?: string }>) => {
      start(async () => {
        const res = await fn();
        if (res.ok) {
          toast.success(label);
          setSelection({});
          router.refresh();
        } else {
          toast.error(res.error ?? "Something went wrong");
        }
      });
    },
    [router]
  );

  const columns = useMemo<ColumnDef<ArticleRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected()
                ? true
                : table.getIsSomePageRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(v) => table.toggleAllPageRowsSelected(Boolean(v))}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
            aria-label="Select row"
          />
        ),
        size: 32,
      },
      {
        accessorKey: "headline",
        header: "Headline",
        cell: ({ row }) => (
          <div className="min-w-[240px]">
            <Link
              href={`/admin/articles/${row.original.id}/edit`}
              className="line-clamp-2 font-medium hover:underline"
            >
              {row.original.headline || (
                <span className="italic text-muted-ui-foreground">Untitled</span>
              )}
            </Link>
            <p className="mt-0.5 text-xs text-muted-ui-foreground">
              /{row.original.slug}
              {row.original.placement ? (
                <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary">
                  {SLOT_META[row.original.placement.slot as Slot]?.label ??
                    row.original.placement.slot}
                </span>
              ) : null}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <div>
            <StatusBadge status={row.original.status} />
            {row.original.status === "SCHEDULED" && row.original.scheduledFor ? (
              <p className="mt-1 text-[11px] text-muted-ui-foreground">
                {formatDateTime(row.original.scheduledFor)}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "section.name",
        header: "Section",
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.section.name}</span>,
      },
      {
        accessorKey: "author.name",
        header: "Author",
        cell: ({ row }) => <span className="whitespace-nowrap">{row.original.author.name}</span>,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        cell: ({ row }) => (
          <time
            dateTime={row.original.updatedAt}
            title={formatDateTime(row.original.updatedAt)}
            className="whitespace-nowrap text-muted-ui-foreground"
          >
            {formatRelative(row.original.updatedAt)}
          </time>
        ),
      },
      {
        accessorKey: "publishedAt",
        header: "Published",
        cell: ({ row }) =>
          row.original.publishedAt ? (
            <time
              dateTime={row.original.publishedAt}
              className="whitespace-nowrap text-muted-ui-foreground"
            >
              {formatDateTime(row.original.publishedAt)}
            </time>
          ) : (
            <span className="text-muted-ui-foreground">—</span>
          ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const a = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${a.headline}`}>
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href={`/admin/articles/${a.id}/edit`}>
                    <Pencil /> Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/admin/preview/${a.id}`} target="_blank" rel="noopener noreferrer">
                    <Eye /> Preview
                  </Link>
                </DropdownMenuItem>
                {a.status === "PUBLISHED" ? (
                  <DropdownMenuItem asChild>
                    <a href={`/article/${a.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink /> View live
                    </a>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem asChild>
                  <Link href={`/admin/articles/${a.id}/revisions`}>
                    <History /> Revisions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    run("Copy created", async () => {
                      const res = await duplicateArticleAction(a.id);
                      if (res.ok) router.push(`/admin/articles/${res.data.id}/edit`);
                      return res;
                    })
                  }
                >
                  <Copy /> Duplicate
                </DropdownMenuItem>
                {a.status !== "PUBLISHED" ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      run("Published", () => setStatusAction({ ids: [a.id], status: "PUBLISHED" }))
                    }
                  >
                    <Upload /> Publish now
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={() =>
                      run("Moved to drafts", () =>
                        setStatusAction({ ids: [a.id], status: "DRAFT" })
                      )
                    }
                  >
                    <Undo2 /> Unpublish
                  </DropdownMenuItem>
                )}
                {a.status !== "ARCHIVED" ? (
                  <DropdownMenuItem
                    onSelect={() =>
                      run("Archived", () => setStatusAction({ ids: [a.id], status: "ARCHIVED" }))
                    }
                  >
                    <Archive /> Archive
                  </DropdownMenuItem>
                ) : null}
                {canDelete ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive onSelect={() => setToDelete(a)}>
                      <Trash2 /> Delete
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        size: 40,
      },
    ],
    [canDelete, router, run]
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r.id,
    state: { rowSelection: selection },
    onRowSelectionChange: setSelection,
    enableRowSelection: true,
  });

  function goToPage(p: number) {
    const next = new URLSearchParams(params.toString());
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    router.push(`/admin/articles?${next.toString()}`);
  }

  return (
    <div className="space-y-3">
      {selectedIds.length > 0 ? (
        <div
          className="flex flex-wrap items-center gap-2 rounded-md border bg-accent/40 px-3 py-2 text-sm"
          role="region"
          aria-label="Bulk actions"
        >
          <span className="font-medium">{selectedIds.length} selected</span>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run("Published", () => setStatusAction({ ids: selectedIds, status: "PUBLISHED" }))
            }
          >
            <Upload /> Publish
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run("Moved to drafts", () => setStatusAction({ ids: selectedIds, status: "DRAFT" }))
            }
          >
            <Undo2 /> Unpublish
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() =>
              run("Archived", () => setStatusAction({ ids: selectedIds, status: "ARCHIVED" }))
            }
          >
            <Archive /> Archive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelection({})}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead
                    key={h.id}
                    style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}
                  >
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-16 text-center text-sm text-muted-ui-foreground"
                >
                  No articles match these filters.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-ui-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      ) : null}

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this article?"
        description={`“${toDelete?.headline ?? ""}” and its revisions will be removed permanently. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!toDelete) return;
          const res = await deleteArticleAction(toDelete.id);
          if (res.ok) {
            toast.success("Article deleted");
            router.refresh();
          } else toast.error(res.error ?? "Could not delete");
          setToDelete(null);
        }}
      />
    </div>
  );
}
