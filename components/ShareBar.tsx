"use client";

import { useEffect, useState } from "react";
import { Facebook, Link2, Mail, Share2, Twitter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ShareBarProps {
  url: string;
  title: string;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ShareBar({ url, title, orientation = "horizontal", className }: ShareBarProps) {
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, url });
    } catch {
      // user dismissed the sheet
    }
  }

  const btn =
    "inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-ink transition-colors hover:bg-ink hover:text-paper";

  return (
    <div
      data-share-bar
      className={cn(
        "flex gap-2",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className
      )}
      role="group"
      aria-label="Share this article"
    >
      <button type="button" onClick={copy} className={btn} aria-label="Copy link">
        <Link2 className="h-4 w-4" aria-hidden="true" />
      </button>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on X"
      >
        <Twitter className="h-4 w-4" aria-hidden="true" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        aria-label="Share on Facebook"
      >
        <Facebook className="h-4 w-4" aria-hidden="true" />
      </a>
      <a
        href={`mailto:?subject=${encodedTitle}&body=${encodedUrl}`}
        className={btn}
        aria-label="Share by email"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
      </a>
      {canNativeShare ? (
        <button
          type="button"
          onClick={nativeShare}
          className={btn}
          aria-label="More sharing options"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
