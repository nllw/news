import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
] as const;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const mediaMetaSchema = z.object({
  alt: z.string().trim().max(300, "Keep alt text under 300 characters").default(""),
  credit: z.string().trim().max(200).optional().default(""),
  caption: z.string().trim().max(500).optional().default(""),
});
export type MediaMetaInput = z.infer<typeof mediaMetaSchema>;
