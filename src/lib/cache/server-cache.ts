import { Redis } from "@upstash/redis";

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export async function readServerCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (redis) {
    try {
      return (await redis.get<T>(key)) ?? null;
    } catch {
      // Fall through to memory on Redis errors.
    }
  }

  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  try {
    return JSON.parse(entry.value) as T;
  } catch {
    memoryStore.delete(key);
    return null;
  }
}

export async function writeServerCache<T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      // Fall through to memory.
    }
  }

  memoryStore.set(key, {
    value: JSON.stringify(value),
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export async function invalidateServerCache(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      // Ignore Redis delete errors.
    }
  }
  memoryStore.delete(key);
}

export async function invalidateServerCachePrefix(prefix: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // Ignore Redis errors.
    }
  }

  for (const key of [...memoryStore.keys()]) {
    if (key.startsWith(prefix)) memoryStore.delete(key);
  }
}
