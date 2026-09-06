"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article, Slot } from "@/lib/types";

const SLOTS: { value: Slot; label: string; help: string }[] = [
  { value: "hero", label: "Hero (top story)", help: "The single lead story at the top of the page." },
  { value: "hero-secondary", label: "Hero — secondary", help: "Runs just below the hero story." },
  { value: "sidebar", label: "Sidebar", help: "Short list next to the lead package." },
  { value: "grid", label: "Grid", help: "Standard story card in the grid below." },
  { value: "unplaced", label: "Unplaced", help: "Saved but not shown on the front page yet." }
];

type FormValue = Omit<Article, "id"> & { id?: string };

export function ArticleForm({ initial }: { initial?: Article }) {
  const router = useRouter();
  const isEdit = Boolean(initial);
  const [values, setValues] = useState<FormValue>(
    initial ?? {
      slug: "",
      headline: "",
      dek: "",
      byline: "",
      section: "Local",
      imageUrl: "",
      imageCaption: "",
      body: "",
      slot: "unplaced",
      order: 0,
      publishedAt: new Date().toISOString()
    }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof FormValue>(key: K, val: FormValue[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = isEdit ? `/api/articles/${initial!.id}` : "/api/articles";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });

    setSaving(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      setError("Something went wrong saving this article.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <Field label="Headline">
          <input
            required
            value={values.headline}
            onChange={(e) => update("headline", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Dek (subheadline / summary)">
          <textarea
            required
            rows={2}
            value={values.dek}
            onChange={(e) => update("dek", e.target.value)}
            className="input"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Byline">
            <input
              required
              value={values.byline}
              onChange={(e) => update("byline", e.target.value)}
              className="input"
              placeholder="By Jane Doe"
            />
          </Field>
          <Field label="Section">
            <input
              required
              value={values.section}
              onChange={(e) => update("section", e.target.value)}
              className="input"
            />
          </Field>
        </div>

        <Field label="Image URL">
          <input
            required
            value={values.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
            className="input"
            placeholder="https://..."
          />
        </Field>

        <Field label="Image caption (optional)">
          <input
            value={values.imageCaption ?? ""}
            onChange={(e) => update("imageCaption", e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Body (separate paragraphs with a blank line)">
          <textarea
            required
            rows={10}
            value={values.body}
            onChange={(e) => update("body", e.target.value)}
            className="input font-mono text-sm"
          />
        </Field>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <h2 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
          Placement on the front page
        </h2>
        <Field label="Slot">
          <select
            value={values.slot}
            onChange={(e) => update("slot", e.target.value as Slot)}
            className="input"
          >
            {SLOTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {SLOTS.find((s) => s.value === values.slot)?.help}
          </p>
        </Field>
        <Field label="Order (lower shows first within its slot)">
          <input
            type="number"
            value={values.order}
            onChange={(e) => update("order", Number(e.target.value))}
            className="input w-32"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-admin-accent text-white text-sm font-medium px-5 py-2 rounded-md hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create article"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-sm text-gray-500 hover:text-admin-ink"
        >
          Cancel
        </button>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px #2a5c8a;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}
