"use client";

import { useEffect, useState } from "react";
import { dashboardFetch } from "@/src/lib/client/dashboard-fetch";
import {
  getCacheAgeMs,
  hydrateCachedData,
  invalidateCachedData,
  writeCachedData,
} from "@/src/lib/client/request-cache";

const DASHBOARD_CACHE_TTL_MS = 5 * 60_000;
const DASHBOARD_STALE_MS = 90_000;

export function useDashboardBootstrap<T>(cacheKey: string, url: string) {
  const [data, setData] = useState<T | null>(() => hydrateCachedData<T>(cacheKey));
  const [error, setError] = useState("");
  const isLoading = !data && !error;

  useEffect(() => {
    let cancelled = false;

    async function load(background = false) {
      try {
        const payload = await dashboardFetch<T>(url, cacheKey, DASHBOARD_CACHE_TTL_MS);
        if (cancelled) return;
        setData(payload);
        setError("");
        if (!background) return;
      } catch {
        if (!cancelled && !background) {
          setError("Could not load this page. Refresh to try again.");
        }
      }
    }

    const cached = hydrateCachedData<T>(cacheKey);
    const cacheAge = getCacheAgeMs(cacheKey);

    if (cached) {
      setData(cached);
      if (cacheAge === null || cacheAge > DASHBOARD_STALE_MS) {
        void load(true);
      }
    } else {
      void load(false);
    }

    return () => {
      cancelled = true;
    };
  }, [cacheKey, url]);

  async function refresh(): Promise<T | null> {
    invalidateCachedData(cacheKey);
    try {
      const payload = await dashboardFetch<T>(url, cacheKey, DASHBOARD_CACHE_TTL_MS);
      setData(payload);
      setError("");
      return payload;
    } catch {
      setError("Could not load this page. Refresh to try again.");
      return null;
    }
  }

  return { data, error, isLoading, refresh };
}

export function prefetchDashboardBootstrap(url: string, cacheKey?: string) {
  const key = cacheKey ?? url;
  const cacheAge = getCacheAgeMs(key);
  if (cacheAge !== null && cacheAge < DASHBOARD_STALE_MS) {
    return Promise.resolve();
  }
  return dashboardFetch(url, key, DASHBOARD_CACHE_TTL_MS)
    .then(() => undefined)
    .catch(() => undefined);
}
