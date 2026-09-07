"use client";

import { useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UploadDropzone, type UploadedMedia } from "./UploadDropzone";
import { searchMediaAction } from "@/app/admin/actions/media-search";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (media: UploadedMedia) => void;
  onClose: () => void;
  title?: string;
}

/** Choose from the library or upload something new. */
export function MediaPickerDialog({ onSelect, onClose, title = "Choose an image" }: Props) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<UploadedMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<UploadedMedia | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchMediaAction(q);
      if (!cancelled) {
        setItems(res.ok ? res.data : []);
        setLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Pick from the library or upload a new image.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="library">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="library" className="space-y-3">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-ui-foreground"
                aria-hidden="true"
              />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by alt text or caption…"
                className="pl-8"
                aria-label="Search media"
                autoFocus
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-ui-foreground" />
                </div>
              ) : items.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-ui-foreground">
                  No images found.
                </p>
              ) : (
                <ul
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5"
                  role="listbox"
                  aria-label="Images"
                >
                  {items.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected?.id === m.id}
                        onClick={() => setSelected(m)}
                        onDoubleClick={() => onSelect(m)}
                        className={cn(
                          "block w-full overflow-hidden rounded-md border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          selected?.id === m.id ? "border-primary" : "border-transparent"
                        )}
                        title={m.alt}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={m.thumbUrl ?? m.url}
                          alt={m.alt}
                          className="aspect-square w-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="truncate text-xs text-muted-ui-foreground">
                {selected ? selected.alt || "No alt text" : "Select an image"}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button disabled={!selected} onClick={() => selected && onSelect(selected)}>
                  Use image
                </Button>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="upload">
            <UploadDropzone onUploaded={(m) => onSelect(m)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
