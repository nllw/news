import sharp from "sharp";
import { createId } from "@paralleldrive/cuid2";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation/media";

const FULL_WIDTH = 2000;
const THUMB_WIDTH = 480;

export class UploadError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
  }
}

export interface ProcessedUpload {
  id: string;
  url: string;
  thumbUrl: string | null;
  alt: string;
  credit: string | null;
  caption: string | null;
  width: number;
  height: number;
}

/**
 * Validate, sniff, resize, and store an uploaded image. Produces a full-size
 * WebP (max 2000px wide) and a 480px thumbnail, then records a Media row.
 */
export async function processImageUpload(opts: {
  buffer: Buffer;
  declaredType: string;
  alt: string;
  credit?: string;
  caption?: string;
  uploadedById: string;
}): Promise<ProcessedUpload> {
  const { buffer, declaredType } = opts;
  if (buffer.byteLength === 0) throw new UploadError("The file is empty.");
  if (buffer.byteLength > MAX_UPLOAD_BYTES)
    throw new UploadError("Images must be 10 MB or smaller.", 413);
  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(declaredType)) {
    throw new UploadError("Use a JPEG, PNG, WebP, AVIF, or GIF image.");
  }

  let meta: sharp.Metadata;
  try {
    meta = await sharp(buffer).metadata();
  } catch {
    throw new UploadError("That file could not be read as an image.");
  }
  if (!meta.format || !["jpeg", "png", "webp", "avif", "gif"].includes(meta.format)) {
    throw new UploadError("That file could not be read as an image.");
  }

  const base = sharp(buffer, { animated: false }).rotate();
  const full = await base
    .clone()
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toBuffer();

  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const id = createId();
  const fullKey = `images/${yyyy}/${mm}/${id}-full.webp`;
  const thumbKey = `images/${yyyy}/${mm}/${id}-thumb.webp`;

  await storage.put(fullKey, full.data, "image/webp");
  await storage.put(thumbKey, thumb, "image/webp");

  const media = await prisma.media.create({
    data: {
      key: fullKey,
      url: storage.publicUrl(fullKey),
      thumbUrl: storage.publicUrl(thumbKey),
      alt: opts.alt,
      credit: opts.credit || null,
      caption: opts.caption || null,
      width: full.info.width,
      height: full.info.height,
      mimeType: "image/webp",
      sizeBytes: full.info.size,
      uploadedById: opts.uploadedById,
    },
  });

  return {
    id: media.id,
    url: media.url,
    thumbUrl: media.thumbUrl,
    alt: media.alt,
    credit: media.credit,
    caption: media.caption,
    width: media.width,
    height: media.height,
  };
}
