"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
  overviewCacheKey,
  sustainabilityCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateWorkspaceCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import {
  cachedFetch,
  hydrateCachedData,
} from "@/src/lib/client/request-cache";
import { prefetchDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { AnteikuLogo } from "@/app/components/anteiku-logo";
import { DashboardMobileBar } from "./dashboard-mobile-bar";
import { DashboardNav } from "./dashboard-nav";
import { WorkspaceLocationSwitcher } from "./workspace-location-switcher";

interface BusinessContext {
  business: {
    id: string;
    name: string;
    countryCode: string;
    currencyCode: string;
    role: string;
  };
  location: {
    id: string;
    name: string;
  };
  locations: Array<{
    id: string;
    name: string;
  }>;
  isPlatformAdmin?: boolean;
}

const PRIORITY_WARM_ROUTES: Array<{ cacheKey: string; url: string }> = [
  { cacheKey: overviewCacheKey(7), url: DASHBOARD_BOOTSTRAP_URL.overview },
  { cacheKey: DASHBOARD_CACHE.floor, url: DASHBOARD_BOOTSTRAP_URL.floor },
  { cacheKey: DASHBOARD_CACHE.products, url: DASHBOARD_BOOTSTRAP_URL.products },
  { cacheKey: DASHBOARD_CACHE.waste, url: DASHBOARD_BOOTSTRAP_URL.waste },
  { cacheKey: DASHBOARD_CACHE.inventory, url: DASHBOARD_BOOTSTRAP_URL.inventory },
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
  const pathname = usePathname();
  const isFloorMode = pathname.startsWith("/dashboard/floor");
  const [navOpen, setNavOpen] = useState(false);
  const [workspace, setWorkspace] = useState<BusinessContext | null>(() => {
    const cached = hydrateCachedData<BusinessContext>(DASHBOARD_CACHE.business);
    if (!cached?.business || !cached.location || !cached.locations) {
      return null;
    }
    return cached;
  });

  async function refreshWorkspaceAfterLocationChange() {
    invalidateWorkspaceCaches();
    const response = await fetch(DASHBOARD_BOOTSTRAP_URL.business);
    if (response.ok) {
      setWorkspace(await response.json());
    }
    router.refresh();
  }

  useEffect(() => {
    let cancelled = false;

    for (const route of PRIORITY_WARM_ROUTES) {
      void prefetchDashboardBootstrap(route.url, route.cacheKey);
    }

    const defer = () => {
      for (const route of DEFERRED_WARM_ROUTES) {
        void prefetchDashboardBootstrap(route.url, route.cacheKey);
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
        if (!cancelled) setWorkspace(payload);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isFloorMode) {
    return <div className="floor-shell">{children}</div>;
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <AnteikuLogo href="/dashboard" size="sm" variant="sidebar" />
        <DashboardNav
          isPlatformAdmin={Boolean(workspace?.isPlatformAdmin)}
          onLocationChanged={refreshWorkspaceAfterLocationChange}
          onOpenChange={setNavOpen}
          open={navOpen}
          signOutAction={signOutAction}
          workspace={workspace}
        />
        <div className="app-sidebar-foot">
          {workspace?.locations && workspace.locations.length > 0 ? (
            <WorkspaceLocationSwitcher
              activeLocationId={
                workspace.location?.id ?? workspace.locations[0]?.id ?? ""
              }
              canManageLocations={
                workspace.business.role === "owner" ||
                workspace.business.role === "admin"
              }
              locations={workspace.locations}
              onChanged={refreshWorkspaceAfterLocationChange}
            />
          ) : null}
          <div className="app-business">
            <span>
              {workspace ? workspace.business.name.slice(0, 2).toUpperCase() : "..."}
            </span>
            <div>
              <strong>{workspace?.business.name ?? "Loading"}</strong>
              <small>
                {workspace?.location.name
                  ? `${workspace.location.name} / ${workspace.business.role}`
                  : workspace?.business.role ?? ""}
              </small>
            </div>
          </div>
          {workspace?.isPlatformAdmin ? (
            <Link className="app-platform-link" href="/internal">
              Platform console
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button className="app-signout" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div
        className="app-content"
        onMouseDown={(event) => {
          const target = event.target as HTMLElement;
          if (
            target.closest(
              "input, textarea, select, [contenteditable='true'], .is-selectable, .calculation-explainer-body, .waste-log-table",
            )
          ) {
            return;
          }
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
          }
        }}
      >
        <WorkspaceContextBand
          onLocationChanged={refreshWorkspaceAfterLocationChange}
          workspace={workspace}
        />
        <div className="app-content-body">{children}</div>
        <DashboardMobileBar onOpenMenu={() => setNavOpen(true)} />
      </div>
    </div>
  );
}

function WorkspaceContextBand({
  onLocationChanged,
  workspace,
}: {
  onLocationChanged: () => Promise<void>;
  workspace: BusinessContext | null;
}) {
  const activeLocationId =
    workspace?.location?.id ?? workspace?.locations[0]?.id ?? "";

  return (
    <section className="workspace-context-band" aria-label="Active workspace">
      <div className="workspace-context-copy">
        <span>Active workspace</span>
        <strong>{workspace?.business.name ?? "Loading workspace"}</strong>
        <p>
          Daily stock, waste, reports, and floor mode follow the active location
          below.
        </p>
      </div>
      {workspace && workspace.locations.length > 0 ? (
        <WorkspaceLocationSwitcher
          activeLocationId={activeLocationId}
          canManageLocations={
            workspace.business.role === "owner" ||
            workspace.business.role === "admin"
          }
          locations={workspace.locations}
          onChanged={onLocationChanged}
          variant="bar"
        />
      ) : null}
    </section>
  );
}
