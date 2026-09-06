"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteButton({ id, headline }: { id: string; headline: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${headline}"? This can't be undone.`)) return;
    setBusy(true);
    await fetch(`/api/articles/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={busy}
      className="text-sm text-red-600 hover:underline disabled:opacity-50"
    >
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
