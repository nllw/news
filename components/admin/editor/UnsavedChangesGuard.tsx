"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Warns before the tab closes and intercepts in-app link clicks while the
 * editor has unsaved changes. Next.js 14 has no router event for this, so a
 * document-level click listener handles anchor navigation.
 */
export function UnsavedChangesGuard({
  when,
  message = "You have unsaved changes. Leave anyway?",
}: {
  when: boolean;
  message?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!when) return;
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        return;
      const anchor = (e.target as HTMLElement | null)?.closest?.(
        "a[href]"
      ) as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search)
        return;
      if (!window.confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Let Next handle it normally
    };
    window.addEventListener("beforeunload", beforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", beforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [when, message, router]);

  return null;
}
