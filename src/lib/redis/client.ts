import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';

const redis = env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

const PLACES_CACHE_TTL = 86400;

export async function getCachedPlaces(query: string, lat: number, lng: number, radius: number) {
  if (!redis) return null;

  const key = buildPlacesKey(query, lat, lng, radius);

  try {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached as string) : null;
  } catch {
    return null;
  }
}

export async function cachePlaces(
  query: string,
  lat: number,
  lng: number,
  radius: number,
  data: unknown
) {
  if (!redis) return;

  const key = buildPlacesKey(query, lat, lng, radius);

  try {
    await redis.set(key, JSON.stringify(data), { ex: PLACES_CACHE_TTL });
  } catch (error) {
    console.error('[REDIS] Failed to cache places:', error);
  }
}

export async function invalidatePlacesCache() {
  if (!redis) return;

  try {
    const keys = await redis.keys('places:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('[REDIS] Failed to invalidate places cache:', error);
  }
}

function buildPlacesKey(query: string, lat: number, lng: number, radius: number): string {
  const normalizedQuery = query.toLowerCase().trim().replace(/\s+/g, '_');
  return `places:${normalizedQuery}:${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
}

export async function getRateLimitCount(identifier: string): Promise<number> {
  if (!redis) return 0;

  try {
    const count = await redis.get(`ratelimit:${identifier}`);
    return count ? (count as number) : 0;
  } catch {
    return 0;
  }
}

export async function incrementRateLimit(
  identifier: string,
  windowMs: number
): Promise<{ count: number; remaining: number; resetAt: number }> {
  if (!redis) {
    return { count: 0, remaining: 100, resetAt: Date.now() + windowMs };
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const resetAt = now + windowMs;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(key);
    pipeline.expire(key, Math.ceil(windowMs / 1000));
    const results = await pipeline.exec();

    const resultArray = results as [error: unknown, result: unknown][] | null;
    const count = (resultArray?.[0]?.[1] as number) || 0;
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

    return {
      count,
      remaining: Math.max(0, maxRequests - count),
      resetAt,
    };
  } catch {
    return { count: 0, remaining: 100, resetAt };
  }
}

export { redis };
