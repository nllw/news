"use server";

import { fail, ok, type ActionResult } from "@/lib/action-result";
import { AuthError, requireRole } from "@/lib/auth-guards";
import { listMedia } from "@/lib/data/media";
import type { UploadedMedia } from "@/components/admin/UploadDropzone";

export async function searchMediaAction(q: string): Promise<ActionResult<UploadedMedia[]>> {
  try {
    await requireRole("ADMIN", "EDITOR");
    const res = await listMedia(1, 60, q);
    return ok(
      res.items.map((m) => ({
        id: m.id,
        url: m.url,
        thumbUrl: m.thumbUrl,
        alt: m.alt,
        credit: m.credit,
        caption: m.caption,
        width: m.width,
        height: m.height,
      }))
    );
  } catch (err) {
    if (err instanceof AuthError) return fail(err.message);
    console.error(err);
    return fail("Could not load media.");
  }
}
