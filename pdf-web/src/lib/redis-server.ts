import { createClient, type RedisClientType } from "redis";
import { selectedRedisUrl } from "./server-env";

const memoryRateLimitStore = new Map<string, { count: number; expiresAt: number }>();

const globalForRedis = globalThis as typeof globalThis & {
  frontendRedisClient?: RedisClientType;
  frontendRedisPromise?: Promise<RedisClientType | null>;
};

async function connectRedis(): Promise<RedisClientType | null> {
  if (!selectedRedisUrl) {
    return null;
  }

  const client = globalForRedis.frontendRedisClient || createClient({
    url: selectedRedisUrl,
  });

  globalForRedis.frontendRedisClient = client;

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function getFrontendRedisClient(): Promise<RedisClientType | null> {
  if (!globalForRedis.frontendRedisPromise) {
    globalForRedis.frontendRedisPromise = connectRedis().catch(() => null);
  }

  return globalForRedis.frontendRedisPromise;
}

function memoryRateLimit(subject: string, maxRequests: number, windowSeconds: number) {
  const now = Date.now();
  const existing = memoryRateLimitStore.get(subject);

  if (!existing || existing.expiresAt <= now) {
    const next = {
      count: 1,
      expiresAt: now + (windowSeconds * 1000),
    };
    memoryRateLimitStore.set(subject, next);
    return {
      allowed: true,
      remaining: Math.max(maxRequests - 1, 0),
      resetSeconds: windowSeconds,
    };
  }

  existing.count += 1;
  memoryRateLimitStore.set(subject, existing);

  return {
    allowed: existing.count <= maxRequests,
    remaining: Math.max(maxRequests - existing.count, 0),
    resetSeconds: Math.max(Math.ceil((existing.expiresAt - now) / 1000), 1),
  };
}

export async function checkFrontendRateLimit(subject: string, maxRequests: number, windowSeconds: number) {
  const redis = await getFrontendRedisClient();

  if (!redis) {
    return memoryRateLimit(subject, maxRequests, windowSeconds);
  }

  const key = `frontend:rate-limit:${subject}`;
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    allowed: requests <= maxRequests,
    remaining: Math.max(maxRequests - requests, 0),
    resetSeconds: Math.max(ttl, 1),
  };
}
