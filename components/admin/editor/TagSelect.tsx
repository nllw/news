"use client";

import { useState, useTransition } from "react";
import { Check, ChevronsUpDown, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createTagAction } from "@/app/admin/actions/taxonomy";
import { cn } from "@/lib/utils";
import type { EditorOption } from "./types";

interface TagSelectProps {
  id?: string;
  options: EditorOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  onOptionCreated: (opt: EditorOption) => void;
}

export function TagSelect({ id, options, value, onChange, onOptionCreated }: TagSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, start] = useTransition();
  const selected = options.filter((o) => value.includes(o.id));
  const exact = options.some((o) => o.name.toLowerCase() === query.trim().toLowerCase());

  function toggle(tagId: string) {
    onChange(value.includes(tagId) ? value.filter((v) => v !== tagId) : [...value, tagId]);
  }

  function create() {
    const name = query.trim();
    if (!name) return;
    start(async () => {
      const res = await createTagAction({ name });
      if (res.ok) {
        onOptionCreated(res.data);
        onChange([...value, res.data.id]);
        setQuery("");
      } else toast.error(res.error ?? "Could not create tag");
    });
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected.length
              ? `${selected.length} tag${selected.length === 1 ? "" : "s"}`
              : "Add tags"}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search or create…" value={query} onValueChange={setQuery} />
            <CommandList>
              <CommandEmpty>No tags yet. Type to create one.</CommandEmpty>
              <CommandGroup>
                {options.map((o) => (
                  <CommandItem key={o.id} value={o.name} onSelect={() => toggle(o.id)}>
                    <Check
                      className={cn("h-4 w-4", value.includes(o.id) ? "opacity-100" : "opacity-0")}
                    />
                    {o.name}
                  </CommandItem>
                ))}
                {query.trim() && !exact ? (
                  <CommandItem value={`__create__${query}`} onSelect={create} disabled={pending}>
                    <Plus className="h-4 w-4" /> Create “{query.trim()}”
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected tags">
          {selected.map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full bg-secondary pl-2.5 pr-1 text-xs"
            >
              {t.name}
              <button
                type="button"
                onClick={() => toggle(t.id)}
                aria-label={`Remove ${t.name}`}
                className="rounded-full p-0.5 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
