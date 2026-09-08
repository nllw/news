"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/ui/field";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "./ConfirmDialog";
import { MediaPickerDialog } from "./MediaPickerDialog";
import {
  createAuthorAction,
  createSectionAction,
  createTagAction,
  deleteAuthorAction,
  deleteSectionAction,
  deleteTagAction,
  updateAuthorAction,
  updateSectionAction,
} from "@/app/admin/actions/taxonomy";
import type { ActionResult, FieldErrors } from "@/lib/action-result";

interface SectionRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  count: number;
}
interface TagRow {
  id: string;
  name: string;
  slug: string;
  count: number;
}
interface AuthorRow {
  id: string;
  name: string;
  slug: string;
  bio: string;
  avatarId: string | null;
  avatarUrl: string | null;
  userId: string | null;
  userEmail: string | null;
  count: number;
}

interface Props {
  isAdmin: boolean;
  sections: SectionRow[];
  tags: TagRow[];
  authors: AuthorRow[];
  users: { id: string; label: string }[];
}

const NONE = "__none__";

export function TaxonomyManager({ isAdmin, sections, tags, authors, users }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [sectionDialog, setSectionDialog] = useState<SectionRow | "new" | null>(null);
  const [authorDialog, setAuthorDialog] = useState<AuthorRow | "new" | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    run: () => Promise<ActionResult<unknown>>;
  } | null>(null);
  const [newTag, setNewTag] = useState("");

  function after(res: ActionResult<unknown>, msg: string) {
    if (res.ok) {
      toast.success(msg);
      router.refresh();
      return true;
    }
    toast.error(res.error ?? "Something went wrong");
    return false;
  }

  return (
    <Tabs defaultValue="sections">
      <TabsList>
        <TabsTrigger value="sections">Sections ({sections.length})</TabsTrigger>
        <TabsTrigger value="authors">Authors ({authors.length})</TabsTrigger>
        <TabsTrigger value="tags">Tags ({tags.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="sections" className="mt-4 space-y-3">
        {isAdmin ? (
          <Button size="sm" onClick={() => setSectionDialog("new")}>
            <Plus /> New section
          </Button>
        ) : (
          <p className="text-xs text-muted-ui-foreground">Only admins can change sections.</p>
        )}
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sections.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="tabular-nums text-muted-ui-foreground">{s.order}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-ui-foreground">/section/{s.slug}</TableCell>
                  <TableCell className="tabular-nums">{s.count}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${s.name}`}
                          onClick={() => setSectionDialog(s)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${s.name}`}
                          className="text-destructive"
                          disabled={s.count > 0}
                          title={s.count > 0 ? "Move its articles first" : undefined}
                          onClick={() =>
                            setConfirm({
                              title: `Delete section “${s.name}”?`,
                              run: () => deleteSectionAction(s.id),
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="authors" className="mt-4 space-y-3">
        <Button size="sm" onClick={() => setAuthorDialog("new")}>
          <Plus /> New author
        </Button>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Linked account</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {authors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {a.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={a.avatarUrl}
                          alt=""
                          className="h-7 w-7 rounded-full object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted-ui text-xs font-semibold">
                          {a.name[0]}
                        </span>
                      )}
                      {a.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-ui-foreground">/author/{a.slug}</TableCell>
                  <TableCell className="text-muted-ui-foreground">{a.userEmail ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{a.count}</TableCell>
                  <TableCell className="text-right">
                    {isAdmin ? (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${a.name}`}
                          onClick={() => setAuthorDialog(a)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${a.name}`}
                          className="text-destructive"
                          disabled={a.count > 0}
                          onClick={() =>
                            setConfirm({
                              title: `Delete author “${a.name}”?`,
                              run: () => deleteAuthorAction(a.id),
                            })
                          }
                        >
                          <Trash2 />
                        </Button>
                      </>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <TabsContent value="tags" className="mt-4 space-y-3">
        <form
          className="flex max-w-sm gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!newTag.trim()) return;
            start(async () => {
              if (after(await createTagAction({ name: newTag }), "Tag added")) setNewTag("");
            });
          }}
        >
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="New tag name"
            aria-label="New tag name"
          />
          <Button type="submit" size="default" loading={pending}>
            <Plus /> Add
          </Button>
        </form>
        <ul className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <li
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full border bg-card pl-3 pr-1 text-sm"
            >
              {t.name} <span className="text-xs text-muted-ui-foreground">({t.count})</span>
              {isAdmin ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 rounded-full"
                  aria-label={`Delete tag ${t.name}`}
                  onClick={() =>
                    setConfirm({
                      title: `Delete tag “${t.name}”?`,
                      run: () => deleteTagAction(t.id),
                    })
                  }
                >
                  <Trash2 className="!size-3" />
                </Button>
              ) : null}
            </li>
          ))}
          {tags.length === 0 ? (
            <li className="text-sm text-muted-ui-foreground">No tags yet.</li>
          ) : null}
        </ul>
      </TabsContent>

      {sectionDialog ? (
        <SectionDialog
          initial={sectionDialog === "new" ? null : sectionDialog}
          onClose={() => setSectionDialog(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}
      {authorDialog ? (
        <AuthorDialog
          initial={authorDialog === "new" ? null : authorDialog}
          users={users}
          isAdmin={isAdmin}
          onClose={() => setAuthorDialog(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(confirm)}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title ?? ""}
        description="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (confirm) after(await confirm.run(), "Deleted");
          setConfirm(null);
        }}
      />
    </Tabs>
  );
}

function SectionDialog({
  initial,
  onClose,
  onSaved,
}: {
  initial: SectionRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [order, setOrder] = useState(String(initial?.order ?? 0));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit section" : "New section"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const input = { name, slug, description, order };
              const res = initial
                ? await updateSectionAction(initial.id, input)
                : await createSectionAction(input);
              if (res.ok) {
                toast.success("Saved");
                onSaved();
                onClose();
              } else {
                setErrors(res.fieldErrors ?? {});
                toast.error(res.error ?? "Could not save");
              }
            });
          }}
        >
          <Field id="s-name" label="Name" required error={errors.name}>
            <Input
              id="s-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field
            id="s-slug"
            label="Slug"
            hint="Leave blank to generate from the name."
            error={errors.slug}
          >
            <Input
              id="s-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              invalid={Boolean(errors.slug)}
            />
          </Field>
          <Field
            id="s-desc"
            label="Description"
            hint="Shown at the top of the section page."
            error={errors.description}
          >
            <Textarea
              id="s-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </Field>
          <Field
            id="s-order"
            label="Nav order"
            hint="Lower numbers appear first."
            error={errors.order}
          >
            <Input
              id="s-order"
              type="number"
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="w-28"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AuthorDialog({
  initial,
  users,
  isAdmin,
  onClose,
  onSaved,
}: {
  initial: AuthorRow | null;
  users: { id: string; label: string }[];
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [avatar, setAvatar] = useState<{ id: string; url: string } | null>(
    initial?.avatarId && initial.avatarUrl ? { id: initial.avatarId, url: initial.avatarUrl } : null
  );
  const [userId, setUserId] = useState(initial?.userId ?? NONE);
  const [picker, setPicker] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit author" : "New author"}</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const input = {
                name,
                slug,
                bio,
                avatarId: avatar?.id ?? null,
                userId: userId === NONE ? null : userId,
              };
              const res = initial
                ? await updateAuthorAction(initial.id, input)
                : await createAuthorAction(input);
              if (res.ok) {
                toast.success("Saved");
                onSaved();
                onClose();
              } else {
                setErrors(res.fieldErrors ?? {});
                toast.error(res.error ?? "Could not save");
              }
            });
          }}
        >
          <div className="flex items-center gap-4">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar.url} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-muted-ui text-xl font-semibold">
                {name[0] ?? "?"}
              </span>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setPicker(true)}>
                {avatar ? "Change photo" : "Add photo"}
              </Button>
              {avatar ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => setAvatar(null)}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
          <Field id="a-name" label="Name" required error={errors.name}>
            <Input
              id="a-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field
            id="a-slug"
            label="Slug"
            hint="Leave blank to generate from the name."
            error={errors.slug}
          >
            <Input
              id="a-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              invalid={Boolean(errors.slug)}
            />
          </Field>
          <Field id="a-bio" label="Bio" error={errors.bio}>
            <Textarea id="a-bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          </Field>
          {isAdmin ? (
            <Field
              id="a-user"
              label="Linked account"
              hint="Optional. Connects this byline to a newsroom login."
            >
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger id="a-user">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Save
            </Button>
          </DialogFooter>
        </form>
        {picker ? (
          <MediaPickerDialog
            onClose={() => setPicker(false)}
            onSelect={(m) => {
              setAvatar({ id: m.id, url: m.thumbUrl ?? m.url });
              setPicker(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
