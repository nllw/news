"use server";

import { fail, fromZodError, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import { saveSettings } from "@/lib/data/settings";
import { revalidateSettings } from "@/lib/data/revalidate";
import { settingsSchema } from "@/lib/validation/user";

export async function saveSettingsAction(raw: unknown): Promise<ActionResult<undefined>> {
  try {
    await requireRole("ADMIN");
    const parsed = settingsSchema.safeParse(raw);
    if (!parsed.success) return fromZodError(parsed.error);
    await saveSettings(parsed.data);
    revalidateSettings();
    return ok(undefined);
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    console.error(err);
    return fail("Something went wrong.");
  }
}
