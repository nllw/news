"use server";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole, requireUser } from "@/lib/auth-guards";
import {
  countAdmins,
  createUser,
  getUserByEmail,
  getUserById,
  resetPassword,
  setPassword,
  updateUser,
  verifyPassword,
} from "@/lib/data/users";
import { changePasswordSchema, createUserSchema, updateUserSchema } from "@/lib/validation/user";

function handleError<T>(err: unknown): ActionResult<T> {
  if (err instanceof AuthError) return fail(err.message);
  console.error(err);
  return fail(err instanceof Error ? err.message : "Something went wrong.");
}

export async function createUserAction(
  raw: unknown
): Promise<ActionResult<{ id: string; email: string; temporaryPassword: string | null }>> {
  try {
    await requireRole("ADMIN");
    const parsed = createUserSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    if (await getUserByEmail(parsed.data.email)) {
      return fail("An account with that email already exists.", { email: ["Already in use"] });
    }
    const { user, temporaryPassword } = await createUser(parsed.data);
    return ok({ id: user.id, email: user.email, temporaryPassword });
  } catch (err) {
    return handleError(err);
  }
}

export async function updateUserAction(id: string, raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const actor = await requireRole("ADMIN");
    const parsed = updateUserSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const target = await getUserById(id);
    if (!target) return fail("That account no longer exists.");
    const demoting =
      target.role === "ADMIN" && (parsed.data.role === "EDITOR" || parsed.data.active === false);
    if (demoting && (await countAdmins()) <= 1) {
      return fail("Keep at least one active admin account.");
    }
    if (actor.id === id && parsed.data.active === false) {
      return fail("You cannot deactivate your own account.");
    }
    await updateUser(id, parsed.data);
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}

export async function resetPasswordAction(
  id: string
): Promise<ActionResult<{ temporaryPassword: string }>> {
  try {
    await requireRole("ADMIN");
    const password = await resetPassword(id);
    return ok({ temporaryPassword: password });
  } catch (err) {
    return handleError(err);
  }
}

export async function changeOwnPasswordAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    const me = await requireUser();
    const parsed = changePasswordSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    const user = await getUserById(me.id);
    if (!user) return fail("Account not found.");
    if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
      return fail("Current password is incorrect.", { currentPassword: ["Incorrect password"] });
    }
    await setPassword(me.id, parsed.data.newPassword);
    return ok(undefined);
  } catch (err) {
    return handleError(err);
  }
}
