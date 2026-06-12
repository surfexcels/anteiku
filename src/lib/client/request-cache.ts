type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  cachedAt: number;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

export function readCachedData<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key);
    return null;
  }
  return entry.data as T;
}

export function writeCachedData<T>(key: string, data: T, ttlMs = 5 * 60_000) {
  const now = Date.now();
  const entry = { data, expiresAt: now + ttlMs, cachedAt: now };
  memoryCache.set(key, entry);

  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem(key, JSON.stringify(entry));
    } catch {
      // Ignore quota errors in private browsing.
    }
  }
}

export function hydrateCachedData<T>(key: string): T | null {
  const memory = readCachedData<T>(key);
  if (memory) return memory;

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<T>;
    if (parsed.expiresAt <= Date.now()) {
      sessionStorage.removeItem(key);
      return null;
    }
    memoryCache.set(key, parsed);
    return parsed.data;
  } catch {
    return null;
  }
}

export function getCacheAgeMs(key: string): number | null {
  const entry = memoryCache.get(key);
  if (entry) {
    return Date.now() - entry.cachedAt;
  }

  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry<unknown>;
    if (parsed.expiresAt <= Date.now()) return null;
    return Date.now() - (parsed.cachedAt ?? parsed.expiresAt);
  } catch {
    return null;
  }
}

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 5 * 60_000,
): Promise<T> {
  const cached = hydrateCachedData<T>(key);
  if (cached) return cached;

  const data = await fetcher();
  writeCachedData(key, data, ttlMs);
  return data;
}

export function invalidateCachedData(key: string) {
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(key);
  }
}

export function invalidateCachedDataByPrefix(prefix: string) {
  for (const key of [...memoryCache.keys()]) {
    if (key.startsWith(prefix)) {
      memoryCache.delete(key);
    }
  }

  if (typeof window === "undefined") return;

  for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
    const key = sessionStorage.key(index);
    if (key?.startsWith(prefix)) {
      sessionStorage.removeItem(key);
    }
  }
}
