import { NextResponse } from "next/server";
import { AuthError, requireRole } from "@/lib/auth-guards";
import { processImageUpload, UploadError } from "@/lib/images";
import { mediaMetaSchema, MAX_UPLOAD_BYTES } from "@/lib/validation/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireRole("ADMIN", "EDITOR");

    const length = Number(req.headers.get("content-length") ?? 0);
    if (length > MAX_UPLOAD_BYTES * 1.2) {
      return NextResponse.json({ error: "Images must be 10 MB or smaller." }, { status: 413 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Attach an image file." }, { status: 400 });
    }
    const meta = mediaMetaSchema.safeParse({
      alt: form.get("alt") ?? "",
      credit: form.get("credit") ?? "",
      caption: form.get("caption") ?? "",
    });
    if (!meta.success) {
      return NextResponse.json(
        { error: "Check the image details.", fieldErrors: meta.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const media = await processImageUpload({
      buffer,
      declaredType: file.type,
      alt: meta.data.alt,
      credit: meta.data.credit,
      caption: meta.data.caption,
      uploadedById: user.id,
    });
    return NextResponse.json(media, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.code === "FORBIDDEN" ? 403 : 401 }
      );
    }
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
