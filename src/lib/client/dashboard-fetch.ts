import { writeCachedData } from "@/src/lib/client/request-cache";

const inflight = new Map<string, Promise<unknown>>();

export async function dashboardFetch<T>(
  url: string,
  cacheKey: string,
  ttlMs = 5 * 60_000,
): Promise<T> {
  const existing = inflight.get(cacheKey);
  if (existing) return existing as Promise<T>;

  const request = fetch(url, { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Request failed");
      return response.json() as Promise<T>;
    })
    .then((payload) => {
      writeCachedData(cacheKey, payload, ttlMs);
      return payload;
    })
    .finally(() => {
      inflight.delete(cacheKey);
    });

  inflight.set(cacheKey, request);
  return request;
}
