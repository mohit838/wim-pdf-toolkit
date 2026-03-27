import crypto from "node:crypto";
import { createClient, type RedisClientType } from "redis";
import { cmsEnv } from "./env";

const globalForRedis = globalThis as typeof globalThis & {
  cmsRedisClient?: RedisClientType;
  cmsRedisConnectPromise?: Promise<RedisClientType>;
};

function cacheKey(key: string): string {
  return `${cmsEnv.redisCachePrefix}:${key}`;
}

function queueKey(name: string): string {
  return `${cmsEnv.redisQueuePrefix}:${name}`;
}

function sessionKey(sessionId: string): string {
  return `${cmsEnv.redisSessionPrefix}:${sessionId}`;
}

function lockKey(name: string): string {
  return `${cmsEnv.redisPrefix}:lock:${name}`;
}

function rateLimitKey(subject: string): string {
  return `${cmsEnv.redisRateLimitPrefix}:${subject}`;
}

async function connectRedis(): Promise<RedisClientType> {
  const client = globalForRedis.cmsRedisClient || createClient({
    url: cmsEnv.redisUrl,
  });

  globalForRedis.cmsRedisClient = client;

  if (!client.isOpen) {
    await client.connect();
  }

  return client;
}

export async function getRedisClient(): Promise<RedisClientType> {
  if (!globalForRedis.cmsRedisConnectPromise) {
    globalForRedis.cmsRedisConnectPromise = connectRedis();
  }

  return globalForRedis.cmsRedisConnectPromise;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  const raw = await redis.get(cacheKey(key));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCachedJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(cacheKey(key), JSON.stringify(value), {
    EX: ttlSeconds,
  });
}

export async function clearPublishedCache(): Promise<void> {
  const redis = await getRedisClient();
  const keys = await redis.keys(cacheKey("*"));
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export async function enqueueRevalidation(releaseId: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.lPush(queueKey("revalidate"), JSON.stringify({
    releaseId,
    createdAt: new Date().toISOString(),
  }));
}

export async function waitForRevalidationJob(timeoutSeconds = 5): Promise<{ releaseId: string } | null> {
  const redis = await getRedisClient();
  const response = await redis.brPop(queueKey("revalidate"), timeoutSeconds);
  if (!response?.element) {
    return null;
  }

  try {
    const parsed = JSON.parse(response.element) as { releaseId?: string };
    if (!parsed.releaseId) {
      return null;
    }

    return {
      releaseId: parsed.releaseId,
    };
  } catch {
    return null;
  }
}

export async function acquireRedisLock(name: string, ttlSeconds: number): Promise<string | null> {
  const redis = await getRedisClient();
  const token = crypto.randomUUID();
  const result = await redis.set(lockKey(name), token, {
    NX: true,
    EX: ttlSeconds,
  });

  return result ? token : null;
}

export async function releaseRedisLock(name: string, token: string): Promise<void> {
  const redis = await getRedisClient();
  const key = lockKey(name);
  const currentValue = await redis.get(key);

  if (currentValue === token) {
    await redis.del(key);
  }
}

export async function createRedisSession(sessionId: string, payload: unknown, ttlSeconds: number): Promise<void> {
  const redis = await getRedisClient();
  await redis.set(sessionKey(sessionId), JSON.stringify(payload), {
    EX: ttlSeconds,
  });
}

export async function readRedisSession<T>(sessionId: string): Promise<T | null> {
  const redis = await getRedisClient();
  const raw = await redis.get(sessionKey(sessionId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function deleteRedisSession(sessionId: string): Promise<void> {
  const redis = await getRedisClient();
  await redis.del(sessionKey(sessionId));
}

export async function touchRedisSession(sessionId: string, ttlSeconds: number): Promise<void> {
  const redis = await getRedisClient();
  await redis.expire(sessionKey(sessionId), ttlSeconds);
}

export async function checkRateLimit(subject: string, maxRequests: number, windowSeconds: number) {
  const redis = await getRedisClient();
  const key = rateLimitKey(subject);
  const requests = await redis.incr(key);

  if (requests === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);
  const remaining = Math.max(maxRequests - requests, 0);

  return {
    allowed: requests <= maxRequests,
    headers: {
      "X-RateLimit-Limit": String(maxRequests),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(Math.max(ttl, 0)),
      ...(requests > maxRequests ? { "Retry-After": String(Math.max(ttl, 1)) } : {}),
    },
  };
}
