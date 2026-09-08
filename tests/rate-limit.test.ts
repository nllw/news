import { describe, expect, it } from "vitest";
import { clearFailures, isRateLimited, recordFailure, retryAfterSeconds } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows five failures then blocks the sixth", () => {
    const key = "test:a";
    const now = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(isRateLimited(key, now + i)).toBe(false);
      recordFailure(key, now + i);
    }
    expect(isRateLimited(key, now + 10)).toBe(true);
    expect(retryAfterSeconds(key, now + 10)).toBeGreaterThan(0);
  });

  it("expires failures after the window", () => {
    const key = "test:b";
    const now = 2_000_000;
    for (let i = 0; i < 5; i++) recordFailure(key, now);
    expect(isRateLimited(key, now + 15 * 60 * 1000 + 1)).toBe(false);
  });

  it("clears on success", () => {
    const key = "test:c";
    for (let i = 0; i < 5; i++) recordFailure(key);
    clearFailures(key);
    expect(isRateLimited(key)).toBe(false);
  });
});
