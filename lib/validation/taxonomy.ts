import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

const optionalSlug = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z
    .string()
    .trim()
    .toLowerCase()
    .max(80)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers, and hyphens")
    .optional()
);

export const sectionInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  slug: optionalSlug,
  description: z.string().trim().max(300).optional().default(""),
  order: z.coerce.number().int().min(0).max(1000).default(0),
});
export type SectionInput = z.infer<typeof sectionInputSchema>;

export const tagInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  slug: optionalSlug,
});
export type TagInput = z.infer<typeof tagInputSchema>;

export const authorInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  slug: optionalSlug,
  bio: z.string().trim().max(1000).optional().default(""),
  avatarId: z
    .preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().nullable())
    .default(null),
  userId: z
    .preprocess((v) => (typeof v === "string" && v.trim() === "" ? null : v), z.string().nullable())
    .default(null),
});
export type AuthorInput = z.infer<typeof authorInputSchema>;
