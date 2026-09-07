"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, KeyRound, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "./ConfirmDialog";
import { createUserAction, resetPasswordAction, updateUserAction } from "@/app/admin/actions/users";
import { formatDate } from "@/lib/format";
import type { FieldErrors } from "@/lib/action-result";
import type { Role } from "@/lib/types";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  active: boolean;
  createdAt: string;
  author: string | null;
}

export function UsersTable({ users, meId }: { users: UserRow[]; meId: string }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [reset, setReset] = useState<UserRow | null>(null);
  const [tempPassword, setTempPassword] = useState<{ email: string; password: string } | null>(
    null
  );
  const [, start] = useTransition();

  function patch(id: string, data: { role?: Role; active?: boolean }) {
    start(async () => {
      const res = await updateUserAction(id, data);
      if (res.ok) {
        toast.success("Updated");
        router.refresh();
      } else toast.error(res.error ?? "Could not update");
    });
  }

  return (
    <div className="space-y-4">
      <Button onClick={() => setCreating(true)}>
        <Plus /> Add user
      </Button>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Byline</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Added</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isMe = u.id === meId;
              return (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    {u.name ?? "—"}{" "}
                    {isMe ? (
                      <Badge variant="muted" className="ml-1">
                        You
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-muted-ui-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Select
                      value={u.role}
                      onValueChange={(v) => patch(u.id, { role: v as Role })}
                      disabled={isMe}
                    >
                      <SelectTrigger className="h-8 w-[120px]" aria-label={`Role for ${u.email}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="EDITOR">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-ui-foreground">{u.author ?? "—"}</TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active}
                      onCheckedChange={(v) => patch(u.id, { active: v })}
                      disabled={isMe}
                      aria-label={`Active status for ${u.email}`}
                    />
                  </TableCell>
                  <TableCell className="text-muted-ui-foreground">
                    {formatDate(u.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setReset(u)}>
                      <KeyRound /> Reset password
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-ui-foreground">
        Admins manage users, sections, settings, and can delete articles. Editors write, edit,
        publish, and arrange the front page.
      </p>

      {creating ? (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onCreated={(email, password) => {
            router.refresh();
            if (password) setTempPassword({ email, password });
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(reset)}
        onOpenChange={(o) => !o && setReset(null)}
        title={`Reset password for ${reset?.email ?? ""}?`}
        description="A new temporary password will be generated and shown once. Their current password stops working immediately."
        confirmLabel="Reset password"
        onConfirm={async () => {
          if (!reset) return;
          const res = await resetPasswordAction(reset.id);
          if (res.ok) setTempPassword({ email: reset.email, password: res.data.temporaryPassword });
          else toast.error(res.error ?? "Could not reset");
          setReset(null);
        }}
      />

      {tempPassword ? (
        <Dialog open onOpenChange={(o) => !o && setTempPassword(null)}>
          <DialogContent size="sm">
            <DialogHeader>
              <DialogTitle>Temporary password</DialogTitle>
              <DialogDescription>
                Share this with {tempPassword.email} through a secure channel. It is shown only
                once. Ask them to change it from Account settings after signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded border bg-muted-ui px-3 py-2 font-mono text-sm">
                {tempPassword.password}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy password"
                onClick={async () => {
                  await navigator.clipboard.writeText(tempPassword.password);
                  toast.success("Copied");
                }}
              >
                <Copy />
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setTempPassword(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

function CreateUserDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (email: string, tempPassword: string | null) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");
  const [password, setPassword] = useState("");
  const [createAuthor, setCreateAuthor] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a user</DialogTitle>
          <DialogDescription>
            Leave the password blank to generate a temporary one.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const res = await createUserAction({
                email,
                name,
                role,
                password: password || undefined,
                createAuthor,
              });
              if (res.ok) {
                toast.success("User created");
                onCreated(res.data.email, res.data.temporaryPassword);
                onClose();
              } else {
                setErrors(res.fieldErrors ?? {});
                toast.error(res.error ?? "Could not create user");
              }
            });
          }}
        >
          <Field id="u-name" label="Name" required error={errors.name}>
            <Input
              id="u-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              invalid={Boolean(errors.name)}
              autoFocus
            />
          </Field>
          <Field id="u-email" label="Email" required error={errors.email}>
            <Input
              id="u-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              invalid={Boolean(errors.email)}
            />
          </Field>
          <Field id="u-role" label="Role">
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
              <SelectTrigger id="u-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EDITOR">Editor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field
            id="u-password"
            label="Password"
            hint="Optional. At least 12 characters."
            error={errors.password}
          >
            <Input
              id="u-password"
              type="text"
              autoComplete="off"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              invalid={Boolean(errors.password)}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={createAuthor} onCheckedChange={(v) => setCreateAuthor(Boolean(v))} />{" "}
            Also create a byline (author) for this person
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={pending}>
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
