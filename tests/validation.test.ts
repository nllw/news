import { describe, expect, it } from "vitest";
import { articleInputSchema } from "@/lib/validation/article";
import { loginSchema, createUserSchema } from "@/lib/validation/user";

describe("articleInputSchema", () => {
  const base = {
    headline: "Headline",
    sectionId: "sec",
    authorId: "auth",
  };

  it("applies defaults", () => {
    const out = articleInputSchema.parse(base);
    expect(out.status).toBe("DRAFT");
    expect(out.tagIds).toEqual([]);
    expect(out.placement).toBeNull();
    expect(out.dek).toBe("");
  });

  it("rejects an empty headline", () => {
    expect(articleInputSchema.safeParse({ ...base, headline: "  " }).success).toBe(false);
  });

  it("normalises empty strings to null for optional fields", () => {
    const out = articleInputSchema.parse({
      ...base,
      seoTitle: "",
      canonicalUrl: "",
      featuredImageId: "",
    });
    expect(out.seoTitle).toBeNull();
    expect(out.canonicalUrl).toBeNull();
    expect(out.featuredImageId).toBeNull();
  });

  it("rejects an invalid slug", () => {
    expect(articleInputSchema.safeParse({ ...base, slug: "Has Spaces" }).success).toBe(false);
  });

  it("requires scheduledFor for SCHEDULED status and it must be in the future", () => {
    expect(articleInputSchema.safeParse({ ...base, status: "SCHEDULED" }).success).toBe(false);
    expect(
      articleInputSchema.safeParse({
        ...base,
        status: "SCHEDULED",
        scheduledFor: "2000-01-01T00:00:00Z",
      }).success
    ).toBe(false);
    expect(
      articleInputSchema.safeParse({
        ...base,
        status: "SCHEDULED",
        scheduledFor: new Date(Date.now() + 3600_000).toISOString(),
      }).success
    ).toBe(true);
  });

  it("rejects unknown slots", () => {
    expect(
      articleInputSchema.safeParse({ ...base, placement: { slot: "banner", order: 0 } }).success
    ).toBe(false);
  });
});

describe("user schemas", () => {
  it("lowercases and trims login email", () => {
    expect(loginSchema.parse({ email: "  A@B.COM ", password: "x" }).email).toBe("a@b.com");
  });
  it("requires 12 character passwords when provided", () => {
    expect(
      createUserSchema.safeParse({ email: "a@b.com", name: "A", password: "short" }).success
    ).toBe(false);
    expect(createUserSchema.safeParse({ email: "a@b.com", name: "A" }).success).toBe(true);
  });
});
