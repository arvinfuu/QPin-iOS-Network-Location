import { beforeEach, describe, expect, it } from "vitest";
import { __resetRateLimits, checkRateLimit } from "../worker/src/rate-limit.js";

describe("rate limit", () => {
  beforeEach(() => __resetRateLimits());

  it("allows up to limit then blocks", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("k", { limit: 5, windowMs: 60_000 }).allowed).toBe(true);
    }
    expect(checkRateLimit("k", { limit: 5, windowMs: 60_000 }).allowed).toBe(false);
  });
});
