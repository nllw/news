import { z } from "zod";
import { ROLES } from "@/lib/types";

export const roleSchema = z.enum(ROLES);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(200, "Password is too long");

export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  name: z.string().trim().min(1, "Name is required").max(100),
  role: roleSchema.default("EDITOR"),
  password: passwordSchema.optional(),
  createAuthor: z.coerce.boolean().default(true),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  role: roleSchema.optional(),
  active: z.coerce.boolean().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const settingsSchema = z.object({
  siteName: z.string().trim().min(1, "Site name is required").max(80),
  tagline: z.string().trim().max(120).default(""),
  description: z.string().trim().max(300).default(""),
  twitter: z.string().trim().max(200).default(""),
  facebook: z.string().trim().max(200).default(""),
  instagram: z.string().trim().max(200).default(""),
  contactEmail: z
    .preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? "" : v),
      z.string().email().or(z.literal(""))
    )
    .default(""),
});
export type SettingsInput = z.infer<typeof settingsSchema>;
