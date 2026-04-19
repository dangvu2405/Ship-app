const MAX_ENTRIES = 50;

/**
 * Returns a shouldShow(key) function that returns true at most once per windowMs per key.
 * Bounded at MAX_ENTRIES to prevent unbounded memory growth.
 */
export function createDedupedCaller(windowMs: number) {
  const timestamps = new Map<string, number>();

  return function shouldShow(key: string): boolean {
    const now = Date.now();
    const last = timestamps.get(key);
    if (last !== undefined && now - last < windowMs) return false;

    if (timestamps.size >= MAX_ENTRIES) {
      let oldestKey = '';
      let oldestTime = Infinity;
      timestamps.forEach((t, k) => { if (t < oldestTime) { oldestTime = t; oldestKey = k; } });
      if (oldestKey) timestamps.delete(oldestKey);
    }

    timestamps.set(key, now);
    return true;
  };
}
