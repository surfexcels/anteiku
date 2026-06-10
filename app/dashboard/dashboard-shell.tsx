"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
  overviewCacheKey,
  sustainabilityCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import {
  cachedFetch,
  hydrateCachedData,
} from "@/src/lib/client/request-cache";
import { prefetchDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { DashboardNav } from "./dashboard-nav";

interface BusinessContext {
  business: {
    id: string;
    name: string;
    countryCode: string;
    currencyCode: string;
    role: string;
  };
}

const PRIORITY_WARM_ROUTES: Array<{ cacheKey: string; url: string }> = [
  { cacheKey: overviewCacheKey(7), url: DASHBOARD_BOOTSTRAP_URL.overview },
  { cacheKey: DASHBOARD_CACHE.products, url: DASHBOARD_BOOTSTRAP_URL.products },
  { cacheKey: DASHBOARD_CACHE.waste, url: DASHBOARD_BOOTSTRAP_URL.waste },
];

const DEFERRED_WARM_ROUTES: Array<{ cacheKey: string; url: string }> = [
  { cacheKey: sustainabilityCacheKey(7), url: DASHBOARD_BOOTSTRAP_URL.sustainability },
  { cacheKey: DASHBOARD_CACHE.insights, url: DASHBOARD_BOOTSTRAP_URL.insights },
  { cacheKey: DASHBOARD_CACHE.reports, url: DASHBOARD_BOOTSTRAP_URL.reports },
  { cacheKey: DASHBOARD_CACHE.imports, url: DASHBOARD_BOOTSTRAP_URL.imports },
];

export function DashboardShell({
  children,
  signOutAction,
}: {
  children: ReactNode;
  signOutAction: () => Promise<void>;
}) {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessContext["business"] | null>(
    () => hydrateCachedData<BusinessContext>(DASHBOARD_CACHE.business)?.business ?? null,
  );

  useEffect(() => {
    let cancelled = false;

    for (const route of PRIORITY_WARM_ROUTES) {
      prefetchDashboardBootstrap(route.url, route.cacheKey);
    }

    const defer = () => {
      for (const route of DEFERRED_WARM_ROUTES) {
        prefetchDashboardBootstrap(route.url, route.cacheKey);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      window.requestIdleCallback(defer, { timeout: 2500 });
    } else {
      setTimeout(defer, 400);
    }

    cachedFetch<BusinessContext>(
      DASHBOARD_CACHE.business,
      async () => {
        const response = await fetch(DASHBOARD_BOOTSTRAP_URL.business);
        if (response.status === 404) {
          router.replace("/onboarding");
          throw new Error("Business not found");
        }
        if (!response.ok) throw new Error("Could not load business");
        return response.json();
      },
      5 * 60_000,
    )
      .then((payload) => {
        if (!cancelled) setBusiness(payload.business);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/dashboard/products" prefetch>
          <span>an</span>
          anteiku
        </Link>
        <DashboardNav />
        <div className="app-business">
          <span>{business ? business.name.slice(0, 2).toUpperCase() : "…"}</span>
          <div>
            <strong>{business?.name ?? "Loading"}</strong>
            <small>{business?.role ?? ""}</small>
          </div>
        </div>
        <form action={signOutAction}>
          <button className="app-signout" type="submit">
            Sign out
          </button>
        </form>
      </aside>
      <div className="app-content">{children}</div>
    </div>
  );
}
