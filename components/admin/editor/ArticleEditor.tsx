"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, CalendarClock, Eye, History, Lock, Unlock, Upload, X } from "lucide-react";
import { toast } from "sonner";
import slugifyLib from "slugify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "../StatusBadge";
import { MediaPickerDialog } from "../MediaPickerDialog";
import { RichTextEditor } from "./RichTextEditor";
import { TagSelect } from "./TagSelect";
import { UnsavedChangesGuard } from "./UnsavedChangesGuard";
import { useAutosave } from "./useAutosave";
import { createArticleAction, updateArticleAction } from "@/app/admin/actions/articles";
import { createAuthorAction } from "@/app/admin/actions/taxonomy";
import { formatRelative, toLocalInputValue } from "@/lib/format";
import { SLOTS, SLOT_META, type ArticleStatus, type Slot } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { EditorArticle, EditorMedia, EditorOption, EditorValues } from "./types";

interface ArticleEditorProps {
  article: EditorArticle | null;
  sections: EditorOption[];
  authors: EditorOption[];
  tags: EditorOption[];
  defaultAuthorId?: string;
  siteName: string;
  siteUrl: string;
}

const NO_PLACEMENT = "__none__";

function autoSlug(headline: string) {
  return slugifyLib(headline, { lower: true, strict: true, trim: true }).slice(0, 96);
}

function toValues(
  a: EditorArticle | null,
  defaults: { sectionId: string; authorId: string }
): EditorValues {
  return {
    headline: a?.headline ?? "",
    dek: a?.dek ?? "",
    slug: a?.slug ?? "",
    slugLocked: Boolean(a && a.status !== "DRAFT"),
    bodyHtml: a?.bodyHtml ?? "",
    sectionId: a?.sectionId ?? defaults.sectionId,
    authorId: a?.authorId ?? defaults.authorId,
    tagIds: a?.tagIds ?? [],
    featuredImage: a?.featuredImage ?? null,
    featuredImageCaption: a?.featuredImageCaption ?? "",
    status: a?.status ?? "DRAFT",
    publishedAt: toLocalInputValue(a?.publishedAt),
    scheduledFor: toLocalInputValue(a?.scheduledFor),
    seoTitle: a?.seoTitle ?? "",
    seoDescription: a?.seoDescription ?? "",
    canonicalUrl: a?.canonicalUrl ?? "",
    placementSlot: a?.placement?.slot ?? "",
    placementOrder: a?.placement?.order ?? 0,
  };
}

function toPayload(v: EditorValues, statusOverride?: ArticleStatus) {
  const status = statusOverride ?? v.status;
  return {
    headline: v.headline,
    dek: v.dek,
    slug: v.slug || undefined,
    bodyHtml: v.bodyHtml,
    sectionId: v.sectionId,
    authorId: v.authorId,
    tagIds: v.tagIds,
    featuredImageId: v.featuredImage?.id ?? null,
    featuredImageCaption: v.featuredImageCaption || null,
    status,
    publishedAt: v.publishedAt ? new Date(v.publishedAt).toISOString() : null,
    scheduledFor:
      status === "SCHEDULED" && v.scheduledFor ? new Date(v.scheduledFor).toISOString() : null,
    seoTitle: v.seoTitle || null,
    seoDescription: v.seoDescription || null,
    canonicalUrl: v.canonicalUrl || null,
    placement:
      status === "PUBLISHED" && v.placementSlot
        ? { slot: v.placementSlot, order: v.placementOrder }
        : null,
  };
}

export function ArticleEditor({
  article,
  sections,
  authors: initialAuthors,
  tags: initialTags,
  defaultAuthorId,
  siteName,
  siteUrl,
}: ArticleEditorProps) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [authors, setAuthors] = useState(initialAuthors);
  const [tags, setTags] = useState(initialTags);
  const [picker, setPicker] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(article?.updatedAt ?? null);
  const [articleId, setArticleId] = useState<string | null>(article?.id ?? null);
  const [savingLabel, setSavingLabel] = useState<string | null>(null);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [tick, setTick] = useState(0);

  const defaults = useMemo(
    () => ({
      sectionId: sections[0]?.id ?? "",
      authorId: defaultAuthorId ?? initialAuthors[0]?.id ?? "",
    }),
    [sections, defaultAuthorId, initialAuthors]
  );

  const form = useForm<EditorValues>({
    defaultValues: toValues(article, defaults),
    mode: "onBlur",
  });
  const { register, control, watch, setValue, getValues, setError, clearErrors, formState, reset } =
    form;
  const values = watch();
  const headline = watch("headline");
  const slugLocked = watch("slugLocked");
  const status = watch("status");

  // Auto-generate the slug from the headline until it is locked
  useEffect(() => {
    if (!slugLocked) setValue("slug", autoSlug(headline), { shouldDirty: true });
  }, [headline, slugLocked, setValue]);

  // Refresh "saved x ago" once a minute
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  const applyFieldErrors = useCallback(
    (fieldErrors: Record<string, string[] | undefined> | undefined) => {
      clearErrors();
      for (const [k, v] of Object.entries(fieldErrors ?? {})) {
        if (!v?.[0]) continue;
        const key = (
          k === "featuredImageId" ? "featuredImage" : k === "placement" ? "placementSlot" : k
        ) as keyof EditorValues;
        setError(key, { message: v[0] });
      }
    },
    [clearErrors, setError]
  );

  const persist = useCallback(
    async (
      statusOverride?: ArticleStatus,
      opts: { silent?: boolean; redirectToList?: boolean } = {}
    ) => {
      const v = getValues();
      if (!v.headline.trim()) {
        setError("headline", { message: "Headline is required" });
        if (!opts.silent) toast.error("Add a headline before saving.");
        return false;
      }
      const payload = toPayload(v, statusOverride);
      setSavingLabel(statusOverride === "PUBLISHED" ? "Publishing…" : "Saving…");
      const res = articleId
        ? await updateArticleAction(articleId, payload)
        : await createArticleAction(payload);
      setSavingLabel(null);
      if (!res.ok) {
        applyFieldErrors(res.fieldErrors);
        if (!opts.silent) toast.error(res.error ?? "Could not save");
        return false;
      }
      const now = new Date().toISOString();
      setLastSaved(now);
      const nextStatus = statusOverride ?? v.status;
      reset(
        {
          ...v,
          status: nextStatus,
          slug: res.data.slug,
          slugLocked: v.slugLocked || nextStatus !== "DRAFT",
        },
        { keepDirty: false }
      );
      if (!articleId) {
        setArticleId(res.data.id);
        window.history.replaceState(null, "", `/admin/articles/${res.data.id}/edit`);
      }
      if (!opts.silent) {
        toast.success(
          nextStatus === "PUBLISHED"
            ? "Published"
            : nextStatus === "SCHEDULED"
              ? "Scheduled"
              : nextStatus === "ARCHIVED"
                ? "Archived"
                : "Draft saved"
        );
      }
      if (opts.redirectToList) router.push("/admin/articles");
      else router.refresh();
      return true;
    },
    [articleId, getValues, setError, applyFieldErrors, reset, router]
  );

  const snapshot = useMemo(() => JSON.stringify(toPayload(values)), [values]);
  const autosaveEnabled =
    status === "DRAFT" && formState.isDirty && Boolean(values.headline.trim());
  useAutosave({
    enabled: autosaveEnabled,
    snapshot,
    save: async () => {
      await persist("DRAFT", { silent: true });
    },
  });

  const publicPath = `/article/${values.slug || "…"}`;
  const isDirty = formState.isDirty;
  const err = (k: keyof EditorValues) => formState.errors[k]?.message as string | undefined;

  const scheduledRef = useRef<HTMLInputElement>(null);

  function act(statusOverride?: ArticleStatus, redirectToList = false) {
    start(async () => {
      await persist(statusOverride, { redirectToList });
    });
  }

  function schedule() {
    const when = getValues("scheduledFor");
    if (!when) {
      setError("scheduledFor", { message: "Pick a date and time first" });
      scheduledRef.current?.focus();
      return;
    }
    act("SCHEDULED");
  }

  const sidebar = (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Publish</CardTitle>
          <StatusBadge status={status} />
        </CardHeader>
        <CardContent className="space-y-3">
          <Field
            id="publishedAt"
            label="Publish date"
            hint="Leave blank to use the moment you publish."
            error={err("publishedAt")}
          >
            <Input id="publishedAt" type="datetime-local" {...register("publishedAt")} />
          </Field>
          <Field id="scheduledFor" label="Schedule for" error={err("scheduledFor")}>
            <Input
              id="scheduledFor"
              type="datetime-local"
              {...register("scheduledFor")}
              ref={(el) => {
                register("scheduledFor").ref(el);
                (scheduledRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
              invalid={Boolean(err("scheduledFor"))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              loading={pending}
              onClick={() => act(status === "PUBLISHED" ? "PUBLISHED" : "DRAFT")}
            >
              {status === "PUBLISHED" ? "Save changes" : "Save draft"}
            </Button>
            {status !== "PUBLISHED" ? (
              <Button type="button" loading={pending} onClick={() => act("PUBLISHED")}>
                <Upload /> Publish
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                loading={pending}
                onClick={() => act("DRAFT")}
              >
                Unpublish
              </Button>
            )}
            {status !== "PUBLISHED" ? (
              <Button type="button" variant="secondary" loading={pending} onClick={schedule}>
                <CalendarClock /> Schedule
              </Button>
            ) : null}
            {status !== "ARCHIVED" ? (
              <Button
                type="button"
                variant="ghost"
                loading={pending}
                onClick={() => act("ARCHIVED", true)}
                className="text-muted-ui-foreground"
              >
                Archive
              </Button>
            ) : (
              <Button type="button" variant="ghost" loading={pending} onClick={() => act("DRAFT")}>
                Restore to draft
              </Button>
            )}
          </div>
          {articleId ? (
            <div className="flex flex-wrap gap-3 pt-1 text-xs">
              <Link
                href={`/admin/preview/${articleId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Eye className="h-3.5 w-3.5" /> Preview
              </Link>
              <Link
                href={`/admin/articles/${articleId}/revisions`}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <History className="h-3.5 w-3.5" /> Revisions
                {article ? ` (${article.revisionCount})` : ""}
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {status === "PUBLISHED" ? (
        <Card>
          <CardHeader>
            <CardTitle>Front page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field
              id="placementSlot"
              label="Slot"
              hint={
                values.placementSlot
                  ? SLOT_META[values.placementSlot as Slot]?.help
                  : "Published stories also appear in section blocks automatically."
              }
              error={err("placementSlot")}
            >
              <Controller
                control={control}
                name="placementSlot"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_PLACEMENT}
                    onValueChange={(v) => field.onChange(v === NO_PLACEMENT ? "" : v)}
                  >
                    <SelectTrigger id="placementSlot">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PLACEMENT}>Not placed</SelectItem>
                      {SLOTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {SLOT_META[s].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            {values.placementSlot ? (
              <Field id="placementOrder" label="Order" hint="Lower numbers appear first.">
                <Input
                  id="placementOrder"
                  type="number"
                  min={0}
                  className="w-24"
                  {...register("placementOrder", { valueAsNumber: true })}
                />
              </Field>
            ) : null}
            <Link href="/admin/front-page" className="text-xs text-primary hover:underline">
              Arrange the whole front page
            </Link>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Organise</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field id="sectionId" label="Section" required error={err("sectionId")}>
            <Controller
              control={control}
              name="sectionId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="sectionId" invalid={Boolean(err("sectionId"))}>
                    <SelectValue placeholder="Choose a section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field id="authorId" label="Author" required error={err("authorId")}>
            <Controller
              control={control}
              name="authorId"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="authorId" invalid={Boolean(err("authorId"))}>
                    <SelectValue placeholder="Choose an author" />
                  </SelectTrigger>
                  <SelectContent>
                    {authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newAuthorName.trim();
              if (!name) return;
              start(async () => {
                const res = await createAuthorAction({
                  name,
                  bio: "",
                  avatarId: null,
                  userId: null,
                });
                if (res.ok) {
                  setAuthors((list) =>
                    [...list, res.data].sort((a, b) => a.name.localeCompare(b.name))
                  );
                  setValue("authorId", res.data.id, { shouldDirty: true });
                  setNewAuthorName("");
                  toast.success(`Added ${res.data.name}`);
                } else toast.error(res.error ?? "Could not add author");
              });
            }}
          >
            <Input
              value={newAuthorName}
              onChange={(e) => setNewAuthorName(e.target.value)}
              placeholder="New byline…"
              aria-label="New author name"
              className="h-8 text-xs"
            />
            <Button type="submit" size="sm" variant="outline" disabled={!newAuthorName.trim()}>
              Add
            </Button>
          </form>
          <Field id="tagIds" label="Tags" error={err("tagIds")}>
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => (
                <TagSelect
                  id="tagIds"
                  options={tags}
                  value={field.value}
                  onChange={field.onChange}
                  onOptionCreated={(opt) =>
                    setTags((list) => [...list, opt].sort((a, b) => a.name.localeCompare(b.name)))
                  }
                />
              )}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Featured image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Controller
            control={control}
            name="featuredImage"
            render={({ field }) => (
              <>
                {field.value ? (
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={field.value.thumbUrl ?? field.value.url}
                      alt={field.value.alt}
                      className="aspect-[3/2] w-full rounded border object-cover"
                    />
                    <p className="line-clamp-2 text-xs text-muted-ui-foreground">
                      {field.value.alt || (
                        <span className="text-destructive">
                          Missing alt text. Edit it in Media.
                        </span>
                      )}
                      {field.value.credit ? ` · ${field.value.credit}` : ""}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setPicker(true)}
                      >
                        Replace
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => field.onChange(null)}
                      >
                        <X /> Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => setPicker(true)}
                  >
                    Choose image
                  </Button>
                )}
                {err("featuredImage") ? (
                  <p className="text-xs text-destructive">{err("featuredImage")}</p>
                ) : null}
                {picker ? (
                  <MediaPickerDialog
                    title="Featured image"
                    onClose={() => setPicker(false)}
                    onSelect={(m: EditorMedia) => {
                      field.onChange({
                        id: m.id,
                        url: m.url,
                        thumbUrl: m.thumbUrl,
                        alt: m.alt,
                        credit: m.credit,
                        width: m.width,
                        height: m.height,
                      });
                      setPicker(false);
                    }}
                  />
                ) : null}
              </>
            )}
          />
          <Field id="featuredImageCaption" label="Caption" error={err("featuredImageCaption")}>
            <Input
              id="featuredImageCaption"
              {...register("featuredImageCaption")}
              placeholder="What the reader is looking at"
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search and social</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field
            id="seoTitle"
            label="SEO title"
            hint={`${values.seoTitle.length}/70. Falls back to the headline.`}
            error={err("seoTitle")}
          >
            <Input id="seoTitle" maxLength={70} {...register("seoTitle")} />
          </Field>
          <Field
            id="seoDescription"
            label="Meta description"
            hint={`${values.seoDescription.length}/160. Falls back to the dek.`}
            error={err("seoDescription")}
          >
            <Textarea
              id="seoDescription"
              rows={3}
              maxLength={160}
              {...register("seoDescription")}
            />
          </Field>
          <Field
            id="canonicalUrl"
            label="Canonical URL"
            hint="Only if this story was first published elsewhere."
            error={err("canonicalUrl")}
          >
            <Input
              id="canonicalUrl"
              type="url"
              placeholder="https://"
              {...register("canonicalUrl")}
              invalid={Boolean(err("canonicalUrl"))}
            />
          </Field>
          <div className="rounded border bg-muted-ui/40 p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-ui-foreground">
              Search preview
            </p>
            <p className="mt-1 line-clamp-1 text-sm font-medium text-[#1a0dab] dark:text-[#8ab4f8]">
              {values.seoTitle || values.headline || "Headline"} | {siteName}
            </p>
            <p className="line-clamp-1 text-xs text-emerald-700 dark:text-emerald-400">
              {siteUrl}
              {publicPath}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-ui-foreground">
              {values.seoDescription || values.dek || "A description will appear here."}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="-m-4 md:-m-6 lg:-m-8">
      <UnsavedChangesGuard when={isDirty && !pending} />

      <div className="sticky top-14 z-20 flex h-12 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/articles">
            <ArrowLeft /> Articles
          </Link>
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm">
          <span className="font-medium">{values.headline || "Untitled"}</span>
          <span className="ml-2 text-xs text-muted-ui-foreground" key={tick} aria-live="polite">
            {savingLabel ??
              (isDirty ? "Unsaved changes" : lastSaved ? `Saved ${formatRelative(lastSaved)}` : "")}
          </span>
        </p>
        <div className="hidden items-center gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={pending}
            onClick={() =>
              act(
                status === "PUBLISHED"
                  ? "PUBLISHED"
                  : status === "SCHEDULED"
                    ? "SCHEDULED"
                    : "DRAFT"
              )
            }
          >
            {status === "DRAFT" ? "Save draft" : "Save"}
          </Button>
          {status !== "PUBLISHED" ? (
            <Button type="button" size="sm" loading={pending} onClick={() => act("PUBLISHED")}>
              <Upload /> Publish
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
        <div className="min-w-0 space-y-5">
          <div>
            <label htmlFor="headline" className="sr-only">
              Headline
            </label>
            <Textarea
              id="headline"
              rows={2}
              placeholder="Headline"
              {...register("headline", { required: "Headline is required" })}
              invalid={Boolean(err("headline"))}
              className={cn(
                "resize-none border-0 bg-transparent px-0 font-display text-3xl font-bold leading-tight shadow-none focus-visible:ring-0 md:text-4xl",
                err("headline") && "placeholder:text-destructive"
              )}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${el.scrollHeight}px`;
              }}
            />
            {err("headline") ? (
              <p role="alert" className="text-xs text-destructive">
                {err("headline")}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="dek" className="sr-only">
              Dek
            </label>
            <Textarea
              id="dek"
              rows={2}
              placeholder="Dek: a one or two sentence summary shown under the headline"
              {...register("dek")}
              className="resize-none border-0 bg-transparent px-0 font-body text-lg text-muted-ui-foreground shadow-none focus-visible:ring-0"
            />
            {err("dek") ? <p className="text-xs text-destructive">{err("dek")}</p> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted-ui/30 px-3 py-2 text-xs">
            <span className="text-muted-ui-foreground">{siteUrl}/article/</span>
            <input
              id="slug"
              aria-label="Slug"
              {...register("slug")}
              readOnly={slugLocked}
              className={cn(
                "min-w-[8rem] flex-1 bg-transparent font-mono outline-none",
                slugLocked && "text-muted-ui-foreground"
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7"
              onClick={() => setValue("slugLocked", !slugLocked, { shouldDirty: true })}
              aria-pressed={slugLocked}
              title={
                slugLocked
                  ? "Unlock to edit the slug"
                  : "Lock the slug so headline edits stop changing it"
              }
            >
              {slugLocked ? <Lock /> : <Unlock />} {slugLocked ? "Locked" : "Auto"}
            </Button>
            {err("slug") ? <p className="w-full text-destructive">{err("slug")}</p> : null}
            {status !== "DRAFT" && !slugLocked ? (
              <p className="w-full text-amber-600">
                Changing a live slug adds a redirect from the old address.
              </p>
            ) : null}
          </div>

          <Controller
            control={control}
            name="bodyHtml"
            render={({ field }) => (
              <RichTextEditor id="body" value={field.value} onChange={field.onChange} />
            )}
          />
          {err("bodyHtml") ? <p className="text-xs text-destructive">{err("bodyHtml")}</p> : null}
        </div>

        {/* Settings column: stacks under the content on small screens, sticky beside it on large */}
        <aside aria-label="Article settings">
          <div className="lg:sticky lg:top-[6.5rem] lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:pr-1">
            {sidebar}
          </div>
        </aside>
      </div>
    </div>
  );
}
