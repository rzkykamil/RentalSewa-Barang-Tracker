import { LRUCache } from "lru-cache";

/**
 * In-memory, per-IP rate limiter using a fixed-window counter backed by
 * `lru-cache`. Sufficient for the single-instance Phase 1 deployment (see
 * docs/technical-spec.md §6 and §13) — NOT safe across multiple app
 * instances/processes since each holds its own in-memory cache. Revisit
 * with a shared store (e.g. Redis) if horizontal scaling is introduced.
 *
 * Fixed-window (not sliding-window/token-bucket) is used deliberately: the
 * cache key embeds the current window index, so old windows simply age out
 * of the LRU cache instead of requiring manual bucket bookkeeping.
 */

const WINDOW_MS = 60_000;
const MAX_TRACKED_KEYS = 10_000;

const hitCache = new LRUCache<string, number>({
  max: MAX_TRACKED_KEYS,
  ttl: WINDOW_MS,
});

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  resetAt: number;
}

/**
 * Records one attempt for `${scope}:${identifier}` and reports whether it's
 * within `limit` attempts per rolling 60s window.
 */
export function checkRateLimit(
  scope: string,
  identifier: string,
  limit = 5
): RateLimitResult {
  const windowIndex = Math.floor(Date.now() / WINDOW_MS);
  const key = `${scope}:${identifier}:${windowIndex}`;

  const nextCount = (hitCache.get(key) ?? 0) + 1;
  hitCache.set(key, nextCount);

  return {
    allowed: nextCount <= limit,
    limit,
    remaining: Math.max(limit - nextCount, 0),
    resetAt: (windowIndex + 1) * WINDOW_MS,
  };
}

type HeaderSource =
  | Headers
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

/**
 * Extracts the client IP from common proxy headers. Works both with the
 * `Headers` instance available on `NextRequest` (route handlers) and the
 * plain header object NextAuth passes into `authorize(credentials, req)`.
 */
export function getClientIp(headers: HeaderSource): string {
  if (!headers) {
    return "unknown";
  }

  const readHeader = (name: string): string | undefined => {
    if (headers instanceof Headers) {
      return headers.get(name) ?? undefined;
    }
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwardedFor = readHeader("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return readHeader("x-real-ip") ?? "unknown";
}
