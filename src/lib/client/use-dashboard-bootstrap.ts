"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { dashboardFetch } from "@/src/lib/client/dashboard-fetch";
import {
  getCacheAgeMs,
  hydrateCachedData,
  invalidateCachedData,
  writeCachedData,
} from "@/src/lib/client/request-cache";

const DASHBOARD_CACHE_TTL_MS = 5 * 60_000;
const DASHBOARD_STALE_MS = 5 * 60_000;

export function useDashboardBootstrap<T>(cacheKey: string, url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useLayoutEffect(() => {
    const cached = hydrateCachedData<T>(cacheKey);
    if (cached) {
      setData(cached);
    }
    setReady(true);
  }, [cacheKey]);

  useEffect(() => {
    let cancelled = false;

    async function load(background = false) {
      if (background) {
        setIsRefreshing(true);
      }

      try {
        const payload = await dashboardFetch<T>(url, cacheKey, DASHBOARD_CACHE_TTL_MS);
        if (cancelled) return;
        setData(payload);
        setError("");
      } catch {
        if (!cancelled && !background) {
          setError("Could not load this page. Refresh to try again.");
        }
      } finally {
        if (!cancelled && background) {
          setIsRefreshing(false);
        }
      }
    }

    const cached = hydrateCachedData<T>(cacheKey);
    const cacheAge = getCacheAgeMs(cacheKey);

    if (!cached) {
      void load(false);
    } else if (cacheAge === null || cacheAge > DASHBOARD_STALE_MS) {
      void load(true);
    }

    return () => {
      cancelled = true;
    };
  }, [cacheKey, url]);

  async function refresh(): Promise<T | null> {
    invalidateCachedData(cacheKey);
    setIsRefreshing(true);
    try {
      const payload = await dashboardFetch<T>(url, cacheKey, DASHBOARD_CACHE_TTL_MS);
      setData(payload);
      setError("");
      return payload;
    } catch {
      setError("Could not load this page. Refresh to try again.");
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }

  const isLoading = ready ? !data && !error : true;

  return { data, error, isLoading, isRefreshing, refresh };
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
