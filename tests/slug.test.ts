import { describe, expect, it } from "vitest";
import { ensureUniqueSlug, isValidSlug, makeSlug } from "@/lib/slug";

describe("makeSlug", () => {
  it("slugifies latin headlines", () => {
    expect(makeSlug("Council Approves New Budget: What It Means")).toBe(
      "council-approves-new-budget-what-it-means"
    );
  });

  it("falls back to a random id for non-latin text", () => {
    const slug = makeSlug("市議会が新予算を承認");
    expect(slug).toMatch(/^story-[a-z0-9]{8}$/);
  });

  it("falls back for empty or whitespace headlines", () => {
    expect(makeSlug("   ")).toMatch(/^story-[a-z0-9]{8}$/);
  });

  it("uses a custom fallback prefix", () => {
    expect(makeSlug("!!!", "section")).toMatch(/^section-/);
  });

  it("truncates very long headlines", () => {
    expect(makeSlug("word ".repeat(60)).length).toBeLessThanOrEqual(96);
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase words joined by single hyphens", () => {
    expect(isValidSlug("hello-world-2")).toBe(true);
  });
  it("rejects uppercase, spaces, and doubled hyphens", () => {
    expect(isValidSlug("Hello")).toBe(false);
    expect(isValidSlug("hello world")).toBe(false);
    expect(isValidSlug("hello--world")).toBe(false);
    expect(isValidSlug("-leading")).toBe(false);
  });
});

describe("ensureUniqueSlug", () => {
  it("returns the base when free", async () => {
    expect(await ensureUniqueSlug("story", async () => false)).toBe("story");
  });

  it("appends -2, -3 until free", async () => {
    const taken = new Set(["story", "story-2"]);
    expect(await ensureUniqueSlug("story", async (s) => taken.has(s))).toBe("story-3");
  });
});
