"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Pencil, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "./ConfirmDialog";
import { UploadDropzone } from "./UploadDropzone";
import { deleteMediaAction, updateMediaMetaAction } from "@/app/admin/actions/media";
import { formatDateTime } from "@/lib/format";

export interface MediaRow {
  id: string;
  url: string;
  thumbUrl: string | null;
  alt: string;
  credit: string | null;
  caption: string | null;
  width: number;
  height: number;
  sizeBytes: number;
  createdAt: string;
  uploadedBy: string | null;
}

interface Props {
  items: MediaRow[];
  page: number;
  totalPages: number;
  q: string;
}

function kb(bytes: number) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.round(bytes / 1024)} KB`;
}

export function MediaLibrary({ items, page, totalPages, q }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const [editing, setEditing] = useState<MediaRow | null>(null);
  const [deleting, setDeleting] = useState<MediaRow | null>(null);
  const [query, setQuery] = useState(q);

  function go(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    router.push(`/admin/media?${next.toString()}`);
  }

  return (
    <div className="space-y-6">
      <UploadDropzone onUploaded={() => router.refresh()} />

      <form
        role="search"
        className="relative max-w-sm"
        onSubmit={(e) => {
          e.preventDefault();
          go({ q: query.trim() || undefined, page: undefined });
        }}
      >
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ui-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search alt text, captions, credits…"
          className="pl-8"
          aria-label="Search media"
        />
      </form>

      {items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-ui-foreground">
          No images yet. Upload some above.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {items.map((m) => (
            <li key={m.id} className="group overflow-hidden rounded-lg border bg-card">
              <div className="relative aspect-square bg-muted-ui">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.thumbUrl ?? m.url}
                  alt={m.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2.5">
                <p className="line-clamp-1 text-xs font-medium" title={m.alt}>
                  {m.alt || <span className="italic text-destructive">Missing alt text</span>}
                </p>
                <p className="text-[11px] text-muted-ui-foreground">
                  {m.width}×{m.height} · {kb(m.sizeBytes)}
                </p>
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit details"
                    onClick={() => setEditing(m)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Copy URL"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        new URL(m.url, window.location.origin).toString()
                      );
                      toast.success("URL copied");
                    }}
                  >
                    <Copy />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete"
                    className="ml-auto text-destructive"
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => go({ page: String(page - 1) })}
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
            onClick={() => go({ page: String(page + 1) })}
          >
            Next
          </Button>
        </nav>
      ) : null}

      {editing ? (
        <EditMediaDialog
          media={editing}
          onClose={() => setEditing(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete this image?"
        description="The file is removed from storage. Images still used by an article cannot be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleting) return;
          const res = await deleteMediaAction(deleting.id);
          if (res.ok) {
            toast.success("Image deleted");
            router.refresh();
          } else toast.error(res.error ?? "Could not delete");
          setDeleting(null);
        }}
      />
    </div>
  );
}

export function EditMediaDialog({
  media,
  onClose,
  onSaved,
}: {
  media: MediaRow;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alt, setAlt] = useState(media.alt);
  const [credit, setCredit] = useState(media.credit ?? "");
  const [caption, setCaption] = useState(media.caption ?? "");
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Image details</DialogTitle>
          <DialogDescription>
            Uploaded {formatDateTime(media.createdAt)}
            {media.uploadedBy ? ` by ${media.uploadedBy}` : ""} · {media.width}×{media.height}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={media.url} alt={alt} className="w-full rounded border object-contain" />
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await updateMediaMetaAction(media.id, { alt, credit, caption });
                if (res.ok) {
                  toast.success("Saved");
                  onSaved();
                  onClose();
                } else {
                  setErrors(res.fieldErrors ?? {});
                  toast.error(res.error ?? "Could not save");
                }
              });
            }}
          >
            <Field
              id="alt"
              label="Alt text"
              hint="Describe the image for readers who cannot see it."
              error={errors.alt}
            >
              <Textarea
                id="alt"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                rows={3}
                invalid={Boolean(errors.alt)}
              />
            </Field>
            <Field id="credit" label="Credit" hint="Photographer or agency." error={errors.credit}>
              <Input id="credit" value={credit} onChange={(e) => setCredit(e.target.value)} />
            </Field>
            <Field id="caption" label="Default caption" error={errors.caption}>
              <Input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </Field>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={pending}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
