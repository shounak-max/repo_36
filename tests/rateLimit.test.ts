import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

describe("rate limit", () => {
  beforeEach(() => resetRateLimit());

  it("tracks hits per API key inside a sliding window", () => {
    expect(checkRateLimit("key-a", 1_000, 1_000, 2)).toMatchObject({
      allowed: true,
      remaining: 1
    });
    expect(checkRateLimit("key-a", 1_100, 1_000, 2)).toMatchObject({
      allowed: true,
      remaining: 0
    });
    expect(checkRateLimit("key-a", 1_200, 1_000, 2)).toMatchObject({
      allowed: false,
      retryAfter: 1
    });

    expect(checkRateLimit("key-a", 2_100, 1_000, 2)).toMatchObject({
      allowed: true,
      remaining: 1
    });
  });

  it("keeps different API keys isolated", () => {
    checkRateLimit("key-a", 1_000, 1_000, 1);
    expect(checkRateLimit("key-b", 1_000, 1_000, 1)).toMatchObject({ allowed: true });
  });
});
