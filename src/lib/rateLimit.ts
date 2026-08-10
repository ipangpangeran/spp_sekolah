// In-memory rate limiting store for API protection against Brute Force & DDoS

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const tracker = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tracker.entries()) {
    if (now > value.resetTime) {
      tracker.delete(key);
    }
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    const resetTime = now + windowMs;
    tracker.set(identifier, { count: 1, resetTime });
    return { success: true, remaining: limit - 1, resetTime };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}
