"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation/media";

export interface UploadedMedia {
  id: string;
  url: string;
  thumbUrl: string | null;
  alt: string;
  credit: string | null;
  caption: string | null;
  width: number;
  height: number;
}

interface UploadDropzoneProps {
  onUploaded: (media: UploadedMedia) => void;
  /** Called before the request with the chosen file, so the caller can collect alt text. */
  defaultAlt?: string;
  className?: string;
  compact?: boolean;
}

export async function uploadImage(
  file: File,
  meta: { alt: string; credit?: string; caption?: string }
): Promise<UploadedMedia> {
  const form = new FormData();
  form.set("file", file);
  form.set("alt", meta.alt);
  if (meta.credit) form.set("credit", meta.credit);
  if (meta.caption) form.set("caption", meta.caption);
  const res = await fetch("/api/admin/upload", { method: "POST", body: form });
  const json = (await res.json().catch(() => ({}))) as { error?: string } & Partial<UploadedMedia>;
  if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
  return json as UploadedMedia;
}

export function validateImageFile(file: File): string | null {
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type))
    return "Use a JPEG, PNG, WebP, AVIF, or GIF image.";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be 10 MB or smaller.";
  return null;
}

export function UploadDropzone({
  onUploaded,
  defaultAlt = "",
  className,
  compact,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const problem = validateImageFile(file);
        if (problem) {
          toast.error(`${file.name}: ${problem}`);
          continue;
        }
        const alt = defaultAlt || file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ");
        const media = await uploadImage(file, { alt });
        onUploaded(media);
        toast.success(`Uploaded ${file.name}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        void handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center transition-colors",
        drag ? "border-primary bg-primary/5" : "border-border",
        compact ? "gap-1 px-4 py-4" : "gap-2 px-6 py-10",
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-ui-foreground" aria-hidden="true" />
      ) : (
        <ImagePlus className="h-6 w-6 text-muted-ui-foreground" aria-hidden="true" />
      )}
      <p className="text-sm">
        Drag images here, or{" "}
        <button
          type="button"
          className="font-medium text-primary underline-offset-4 hover:underline"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          browse
        </button>
      </p>
      {!compact ? (
        <p className="text-xs text-muted-ui-foreground">
          JPEG, PNG, WebP, AVIF, or GIF up to 10 MB. Converted to WebP on upload.
        </p>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => void handleFiles(e.target.files)}
        aria-label="Choose images"
      />
    </div>
  );
}
