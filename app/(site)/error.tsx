"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container py-24 text-center">
      <p className="font-ui text-xs font-semibold uppercase tracking-[0.2em] text-wire-text">
        Something went wrong
      </p>
      <h1 className="mt-2 text-balance font-display text-4xl font-bold">
        We could not load this page.
      </h1>
      <p className="mt-4 font-body text-lg text-muted">Please try again in a moment.</p>
      <div className="mt-6 flex items-center justify-center gap-3 font-ui text-sm">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-ink px-5 py-2 font-medium text-paper hover:bg-ink/90"
        >
          Try again
        </button>
        <Link href="/" className="rounded-full border border-rule px-5 py-2 hover:bg-ink/5">
          Front page
        </Link>
      </div>
      {error.digest ? (
        <p className="mt-6 font-ui text-[11px] text-muted">Reference: {error.digest}</p>
      ) : null}
    </div>
  );
}
