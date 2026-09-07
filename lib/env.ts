import { z } from "zod";

const S3_KEYS = [
  "S3_BUCKET",
  "S3_REGION",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "S3_PUBLIC_URL",
] as const;

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().min(1),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url().optional(),
    NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
    STORAGE_DRIVER: z.enum(["s3", "local"]).default("local"),
    S3_BUCKET: z.string().optional(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().url().optional(),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_PUBLIC_URL: z.string().url().optional(),
    UPLOADS_DIR: z.string().default("./uploads"),
    SEED_ADMIN_EMAIL: z.string().email().optional(),
    SEED_ADMIN_PASSWORD: z.string().min(12).optional(),
    CRON_SECRET: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.STORAGE_DRIVER === "s3") {
      for (const key of S3_KEYS) {
        if (!v[key]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [key],
            message: `${key} is required when STORAGE_DRIVER=s3`,
          });
        }
      }
    }
  });

export type Env = z.infer<typeof schema>;

function load(): Env {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  ${i.path.join(".")}: ${i.message}`);
    const message = `Invalid environment configuration:\n${lines.join("\n")}`;
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    }
    console.error(message);
    // In development fall through with a partially valid object so the app can boot
    // and show the problem in the terminal. Missing values throw at first use.
    return schema.parse({
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? "file:../data/app.db",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "development-only-secret-please-change-me-now",
    });
  }
  return result.data;
}

export const env: Env = load();

export const siteUrl = env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
export const isProd = env.NODE_ENV === "production";
