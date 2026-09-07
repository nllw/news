"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { saveFrontPageLayoutAction } from "@/app/admin/actions/articles";
import { searchPublishedAction, type PickerArticle } from "@/app/admin/actions/front-page";
import { SLOTS, SLOT_META, type Slot } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PlacedArticle extends PickerArticle {
  status?: string;
}

interface Placement {
  slot: Slot;
  order: number;
  article: PlacedArticle;
}

type Layout = Record<Slot, PlacedArticle[]>;

function toLayout(list: Placement[]): Layout {
  const layout = { hero: [], "hero-secondary": [], sidebar: [], grid: [] } as Layout;
  for (const p of [...list].sort((a, b) => a.order - b.order)) layout[p.slot].push(p.article);
  return layout;
}

function serialize(layout: Layout) {
  return SLOTS.flatMap((slot) =>
    layout[slot].map((a, order) => ({ articleId: a.id, slot, order }))
  );
}

function findSlot(layout: Layout, id: string): Slot | null {
  for (const slot of SLOTS) if (layout[slot].some((a) => a.id === id)) return slot;
  return null;
}

function Card({
  article,
  onRemove,
  dragging,
}: {
  article: PlacedArticle;
  onRemove?: () => void;
  dragging?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-md border bg-card p-2 text-sm shadow-sm",
        dragging && "shadow-lg ring-2 ring-primary"
      )}
    >
      {article.thumbUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.thumbUrl} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
      ) : (
        <div className="h-12 w-16 shrink-0 rounded bg-muted-ui" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 font-medium leading-snug">{article.headline}</p>
        <p className="text-[11px] text-muted-ui-foreground">
          {article.section} · {article.author}
          {article.publishedAt ? ` · ${formatDate(article.publishedAt, "MMM d")}` : ""}
        </p>
      </div>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${article.headline}`}
          className="rounded p-1 text-muted-ui-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

function SortableCard({ article, onRemove }: { article: PlacedArticle; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: article.id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-stretch gap-1", isDragging && "opacity-40")}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${article.headline}`}
        className="flex w-6 shrink-0 cursor-grab items-center justify-center rounded text-muted-ui-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <Card article={article} onRemove={onRemove} />
      </div>
    </li>
  );
}

function SlotColumn({
  slot,
  items,
  onRemove,
  onAdd,
}: {
  slot: Slot;
  items: PlacedArticle[];
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  const meta = SLOT_META[slot];
  const { setNodeRef, isOver } = useDroppable({ id: `slot:${slot}` });
  const full = meta.capacity !== null && items.length >= meta.capacity;
  return (
    <section
      aria-labelledby={`slot-${slot}`}
      className={cn(
        "flex flex-col rounded-lg border bg-muted-ui/30",
        isOver && "ring-2 ring-primary"
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b p-3">
        <div>
          <h2 id={`slot-${slot}`} className="text-sm font-semibold">
            {meta.label}
            <span className="ml-2 text-xs font-normal text-muted-ui-foreground">
              {items.length}
              {meta.capacity !== null ? ` / ${meta.capacity}` : ""}
            </span>
          </h2>
          <p className="text-xs text-muted-ui-foreground">{meta.help}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          disabled={full}
          title={full ? "This slot is full" : undefined}
        >
          <Plus /> Add
        </Button>
      </header>
      <SortableContext
        id={slot}
        items={items.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul ref={setNodeRef} className="flex min-h-[80px] flex-1 flex-col gap-2 p-3">
          {items.map((a) => (
            <SortableCard key={a.id} article={a} onRemove={() => onRemove(a.id)} />
          ))}
          {items.length === 0 ? (
            <li className="rounded border border-dashed p-4 text-center text-xs text-muted-ui-foreground">
              Drop a story here
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
}

export function FrontPageBuilder({ initial }: { initial: Placement[] }) {
  const router = useRouter();
  const [layout, setLayout] = useState<Layout>(() => toLayout(initial));
  const [saved, setSaved] = useState(() => JSON.stringify(serialize(toLayout(initial))));
  const [active, setActive] = useState<PlacedArticle | null>(null);
  const [addTo, setAddTo] = useState<Slot | null>(null);
  const [pending, start] = useTransition();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dirty = JSON.stringify(serialize(layout)) !== saved;
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const allIds = useMemo(() => new Set(SLOTS.flatMap((s) => layout[s].map((a) => a.id))), [layout]);

  useEffect(() => {
    const onKey = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", onKey);
    return () => window.removeEventListener("beforeunload", onKey);
  }, [dirty]);

  function onDragStart(e: DragStartEvent) {
    const slot = findSlot(layout, String(e.active.id));
    setActive(slot ? (layout[slot].find((a) => a.id === e.active.id) ?? null) : null);
  }

  function onDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const from = findSlot(layout, String(active.id));
    const overId = String(over.id);
    const to = overId.startsWith("slot:") ? (overId.slice(5) as Slot) : findSlot(layout, overId);
    if (!from || !to || from === to) return;
    const capacity = SLOT_META[to].capacity;
    if (capacity !== null && layout[to].length >= capacity) return;
    setLayout((prev) => {
      const item = prev[from].find((a) => a.id === active.id);
      if (!item) return prev;
      const next = { ...prev, [from]: prev[from].filter((a) => a.id !== active.id) };
      const overIndex = overId.startsWith("slot:")
        ? next[to].length
        : next[to].findIndex((a) => a.id === overId);
      const list = [...next[to]];
      list.splice(overIndex < 0 ? list.length : overIndex, 0, item);
      return { ...next, [to]: list };
    });
  }

  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const { active, over } = e;
    if (!over) return;
    const slot = findSlot(layout, String(active.id));
    if (!slot) return;
    const overId = String(over.id);
    if (overId.startsWith("slot:")) return;
    const from = layout[slot].findIndex((a) => a.id === active.id);
    const to = layout[slot].findIndex((a) => a.id === overId);
    if (from < 0 || to < 0 || from === to) return;
    setLayout((prev) => ({ ...prev, [slot]: arrayMove(prev[slot], from, to) }));
  }

  function remove(id: string) {
    setLayout((prev) => {
      const slot = findSlot(prev, id);
      return slot ? { ...prev, [slot]: prev[slot].filter((a) => a.id !== id) } : prev;
    });
  }

  function add(slot: Slot, article: PickerArticle) {
    if (allIds.has(article.id)) {
      toast.error("That story is already placed. Drag it to move it.");
      return;
    }
    setLayout((prev) => ({ ...prev, [slot]: [...prev[slot], article] }));
    setAddTo(null);
  }

  function save() {
    start(async () => {
      const placements = serialize(layout);
      const res = await saveFrontPageLayoutAction({ placements });
      if (res.ok) {
        setSaved(JSON.stringify(placements));
        toast.success("Front page updated");
        iframeRef.current?.contentWindow?.location.reload();
        router.refresh();
      } else toast.error(res.error ?? "Could not save");
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={save} loading={pending} disabled={!dirty}>
            Save front page
          </Button>
          <Button variant="ghost" onClick={() => setLayout(toLayout(initial))} disabled={!dirty}>
            Discard changes
          </Button>
          <span className="text-xs text-muted-ui-foreground" aria-live="polite">
            {dirty ? "Unsaved changes" : "Up to date"}
          </span>
        </div>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActive(null)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {SLOTS.map((slot) => (
              <SlotColumn
                key={slot}
                slot={slot}
                items={layout[slot]}
                onRemove={remove}
                onAdd={() => setAddTo(slot)}
              />
            ))}
          </div>
          <DragOverlay>{active ? <Card article={active} dragging /> : null}</DragOverlay>
        </DndContext>
        <p className="text-xs text-muted-ui-foreground">
          Keyboard: focus a drag handle, press Space to pick up, use the arrow keys to move, and
          Space again to drop.
        </p>
      </div>

      <aside className="hidden xl:block">
        <div className="sticky top-20 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Live preview</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => iframeRef.current?.contentWindow?.location.reload()}
            >
              <RefreshCw /> Reload
            </Button>
          </div>
          <div className="overflow-hidden rounded-lg border bg-white" style={{ height: "70vh" }}>
            <iframe
              ref={iframeRef}
              src="/"
              title="Front page preview"
              className="h-[200%] w-[200%] origin-top-left scale-50"
            />
          </div>
          <p className="text-xs text-muted-ui-foreground">
            Shows the saved layout. Save to refresh it.
          </p>
        </div>
      </aside>

      {addTo ? (
        <AddArticleDialog
          slot={addTo}
          exclude={allIds}
          onClose={() => setAddTo(null)}
          onPick={(a) => add(addTo, a)}
        />
      ) : null}
    </div>
  );
}

function AddArticleDialog({
  slot,
  exclude,
  onClose,
  onPick,
}: {
  slot: Slot;
  exclude: Set<string>;
  onClose: () => void;
  onPick: (a: PickerArticle) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<PickerArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(async () => {
      const res = await searchPublishedAction(q);
      if (!cancelled) {
        setItems(res.ok ? res.data.filter((a) => !exclude.has(a.id)) : []);
        setLoading(false);
      }
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, exclude]);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg" className="p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Add to “{SLOT_META[slot].label}”</DialogTitle>
          <DialogDescription>Published stories not already on the front page.</DialogDescription>
        </DialogHeader>
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search headlines…" value={q} onValueChange={setQ} autoFocus />
          <CommandList className="max-h-[50vh]">
            {loading ? (
              <p className="py-6 text-center text-sm text-muted-ui-foreground">Loading…</p>
            ) : (
              <CommandEmpty>No published stories match.</CommandEmpty>
            )}
            <CommandGroup>
              {items.map((a) => (
                <CommandItem
                  key={a.id}
                  value={a.id}
                  onSelect={() => onPick(a)}
                  className="items-start gap-3 py-2"
                >
                  {a.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbUrl}
                      alt=""
                      className="h-10 w-14 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-14 shrink-0 rounded bg-muted-ui" />
                  )}
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-medium">{a.headline}</p>
                    <p className="text-[11px] text-muted-ui-foreground">
                      {a.section} · {a.author}
                      {a.publishedAt ? ` · ${formatDate(a.publishedAt, "MMM d, yyyy")}` : ""}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
