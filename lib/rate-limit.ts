/**
 * In-memory sliding window limiter. Adequate for a single-server deployment.
 * Keys are typically `login:<ip>` and `login:<email>`.
 */
interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function prune(bucket: Bucket, now: number) {
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS);
}

export function isRateLimited(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  prune(bucket, now);
  return bucket.hits.length >= MAX_ATTEMPTS;
}

export function recordFailure(key: string, now = Date.now()) {
  const bucket = buckets.get(key) ?? { hits: [] };
  prune(bucket, now);
  bucket.hits.push(now);
  buckets.set(key, bucket);
  if (buckets.size > 10_000) {
    // Drop the oldest entries if the map grows unexpectedly
    for (const k of Array.from(buckets.keys()).slice(0, 5000)) buckets.delete(k);
  }
}

export function clearFailures(key: string) {
  buckets.delete(key);
}

export function retryAfterSeconds(key: string, now = Date.now()): number {
  const bucket = buckets.get(key);
  if (!bucket || bucket.hits.length === 0) return 0;
  const oldest = Math.min(...bucket.hits);
  return Math.max(0, Math.ceil((oldest + WINDOW_MS - now) / 1000));
}
