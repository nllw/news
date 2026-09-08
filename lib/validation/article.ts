import { z } from "zod";
import { ARTICLE_STATUSES, SLOTS } from "@/lib/types";
import { SLUG_PATTERN } from "@/lib/slug";

export const slotSchema = z.enum(SLOTS);
export const statusSchema = z.enum(ARTICLE_STATUSES);

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

export const placementSchema = z.object({
  slot: slotSchema,
  order: z.coerce.number().int().min(0).max(10_000),
});

export const articleInputSchema = z
  .object({
    headline: z
      .string()
      .trim()
      .min(1, "Headline is required")
      .max(200, "Keep the headline under 200 characters"),
    dek: z.string().trim().max(500, "Keep the dek under 500 characters").default(""),
    slug: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .trim()
        .toLowerCase()
        .max(120)
        .regex(SLUG_PATTERN, "Use lowercase letters, numbers, and single hyphens")
        .optional()
    ),
    bodyHtml: z.string().max(400_000, "Body is too long").default(""),
    sectionId: z.string().min(1, "Choose a section"),
    authorId: z.string().min(1, "Choose an author"),
    tagIds: z.array(z.string().min(1)).max(20).default([]),
    featuredImageId: z.preprocess(emptyToNull, z.string().min(1).nullable()).default(null),
    featuredImageCaption: z
      .preprocess(emptyToNull, z.string().trim().max(500).nullable())
      .default(null),
    status: statusSchema.default("DRAFT"),
    publishedAt: z.preprocess(emptyToNull, z.coerce.date().nullable()).default(null),
    scheduledFor: z.preprocess(emptyToNull, z.coerce.date().nullable()).default(null),
    seoTitle: z.preprocess(emptyToNull, z.string().trim().max(70).nullable()).default(null),
    seoDescription: z.preprocess(emptyToNull, z.string().trim().max(160).nullable()).default(null),
    canonicalUrl: z
      .preprocess(emptyToNull, z.string().trim().url("Enter a full URL").nullable())
      .default(null),
    placement: placementSchema.nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.status === "SCHEDULED" && !v.scheduledFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledFor"],
        message: "Pick a date and time to schedule publication",
      });
    }
    if (v.status === "SCHEDULED" && v.scheduledFor && v.scheduledFor.getTime() <= Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduledFor"],
        message: "Scheduled time must be in the future. Use Publish to publish now.",
      });
    }
  });

export type ArticleInput = z.infer<typeof articleInputSchema>;
/** Shape before Zod defaults are applied; what the editor form holds. */
export type ArticleFormInput = z.input<typeof articleInputSchema>;

export const articleFiltersSchema = z.object({
  status: statusSchema.optional(),
  sectionId: z.string().optional(),
  authorId: z.string().optional(),
  q: z.string().trim().max(200).optional(),
  sort: z.enum(["updated", "published", "headline"]).default("updated"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(5).max(100).default(25),
});

export type ArticleFilters = z.infer<typeof articleFiltersSchema>;

export const reorderSlotSchema = z.object({
  slot: slotSchema,
  articleIds: z.array(z.string().min(1)).max(200),
});

export const frontPageLayoutSchema = z.object({
  placements: z.array(
    z.object({
      articleId: z.string().min(1),
      slot: slotSchema,
      order: z.number().int().min(0),
    })
  ),
});
