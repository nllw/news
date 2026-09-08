"use client";

import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  /** Serialised snapshot of the values; the hook saves when it changes. */
  snapshot: string;
  delayMs?: number;
  save: () => Promise<void>;
}

/** Debounced autosave. Fires only after the snapshot has been stable for delayMs. */
export function useAutosave({ enabled, snapshot, delayMs = 30_000, save }: Options) {
  const last = useRef(snapshot);
  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    if (!enabled) return;
    if (snapshot === last.current) return;
    const t = setTimeout(async () => {
      try {
        await saveRef.current();
        last.current = snapshot;
      } catch {
        // errors surface in the save handler via toast
      }
    }, delayMs);
    return () => clearTimeout(t);
  }, [enabled, snapshot, delayMs]);

  return {
    markSaved: (s: string) => {
      last.current = s;
    },
  };
}
