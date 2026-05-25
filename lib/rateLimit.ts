import { config } from "@/lib/config";
import { ApiError } from "@/lib/errors";

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
};

const hitsByKey = new Map<string, number[]>();

export function checkRateLimit(
  keyId: string,
  now = Date.now(),
  windowMs = config.rateLimitWindowMs,
  limit = config.rateLimitMax
): RateLimitResult {
  const windowStart = now - windowMs;
  const hits = (hitsByKey.get(keyId) ?? []).filter((timestamp) => timestamp > windowStart);

  if (hits.length >= limit) {
    const oldest = hits[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    hitsByKey.set(keyId, hits);
    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfter
    };
  }

  hits.push(now);
  hitsByKey.set(keyId, hits);

  return {
    allowed: true,
    limit,
    remaining: Math.max(0, limit - hits.length),
    retryAfter: 0
  };
}

export function enforceRateLimit(keyId: string): HeadersInit {
  const result = checkRateLimit(keyId);
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining)
  };

  if (!result.allowed) {
    headers["Retry-After"] = String(result.retryAfter);
    throw new ApiError(429, "RATE_LIMITED", "Rate limit exceeded.", undefined, headers);
  }

  return headers;
}

export function resetRateLimit(): void {
  hitsByKey.clear();
}
