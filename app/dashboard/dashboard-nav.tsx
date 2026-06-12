"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { hydrateCachedData } from "@/src/lib/client/request-cache";
import {
  bootstrapUrlForPath,
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
  overviewCacheKey,
  sustainabilityCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import { prefetchDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { NavIcon } from "./nav-icons";

function cacheKeyForPath(pathname: string) {
  if (pathname === "/dashboard") return overviewCacheKey(7);
  if (pathname.startsWith("/dashboard/products")) return DASHBOARD_CACHE.products;
  if (pathname.startsWith("/dashboard/waste")) return DASHBOARD_CACHE.waste;
  if (pathname.startsWith("/dashboard/insights")) return DASHBOARD_CACHE.insights;
  if (pathname.startsWith("/dashboard/reports")) return DASHBOARD_CACHE.reports;
  if (pathname.startsWith("/dashboard/imports")) return DASHBOARD_CACHE.imports;
  if (pathname.startsWith("/dashboard/inventory")) return DASHBOARD_CACHE.inventory;
  if (pathname.startsWith("/dashboard/sustainability")) return sustainabilityCacheKey(7);
  if (pathname.startsWith("/dashboard/floor")) return DASHBOARD_CACHE.floor;
  if (pathname.startsWith("/dashboard/settings")) return DASHBOARD_CACHE.settings;
  return null;
}

type NavLink = {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  emphasis?: boolean;
};

const trackLinks: NavLink[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
  { href: "/dashboard/floor", label: "Floor mode", icon: "floor", emphasis: true },
  { href: "/dashboard/inventory", label: "Daily stock", icon: "inventory" },
  { href: "/dashboard/waste", label: "Waste log", icon: "waste" },
  { href: "/dashboard/sustainability", label: "Carbon", icon: "carbon" },
];

const baseManageLinks: NavLink[] = [
  { href: "/dashboard/products", label: "Products", icon: "products" },
  { href: "/dashboard/insights", label: "Insights", icon: "insights" },
  { href: "/dashboard/reports", label: "Reports", icon: "reports" },
  { href: "/dashboard/imports", label: "Imports", icon: "imports" },
];

const settingsLink: NavLink = {
  href: "/dashboard/settings",
  label: "Settings",
  icon: "settings",
};

function isActive(pathname: string, link: NavLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

function NavSection({
  label,
  links,
  onNavigate,
  pathname,
  warmRoute,
}: {
  label: string;
  links: NavLink[];
  onNavigate: () => void;
  pathname: string;
  warmRoute: (href: string) => void;
}) {
  return (
    <div className="app-nav-section">
      <span className="app-nav-section-label">{label}</span>
      {links.map((link) => (
        <Link
          className={[
            isActive(pathname, link) ? "active" : "",
            link.emphasis ? "emphasis" : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined}
          href={link.href}
          key={link.href}
          onClick={onNavigate}
          onMouseEnter={() => warmRoute(link.href)}
          onFocus={() => warmRoute(link.href)}
          prefetch
        >
          <span className="app-nav-icon">
            <NavIcon name={link.icon} />
          </span>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

interface BusinessNavContext {
  permissions?: {
    canManageSettings?: boolean;
  };
}

export function DashboardNav({
  open,
  onOpenChange,
  signOutAction,
  isPlatformAdmin = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signOutAction: () => Promise<void>;
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [canManageSettings, setCanManageSettings] = useState(
    () =>
      hydrateCachedData<BusinessNavContext>(DASHBOARD_CACHE.business)?.permissions
        ?.canManageSettings ?? false,
  );

  useEffect(() => {
    let cancelled = false;
    fetch(DASHBOARD_BOOTSTRAP_URL.business)
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: BusinessNavContext | null) => {
        if (!cancelled && payload?.permissions) {
          setCanManageSettings(Boolean(payload.permissions.canManageSettings));
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const manageLinks = canManageSettings
    ? [...baseManageLinks, settingsLink]
    : baseManageLinks;

  function warmRoute(href: string) {
    const bootstrapUrl = bootstrapUrlForPath(href);
    const cacheKey = cacheKeyForPath(href);
    if (bootstrapUrl && cacheKey) {
      void prefetchDashboardBootstrap(bootstrapUrl, cacheKey);
    }
  }

  function closeMenu() {
    onOpenChange(false);
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="app-menu-toggle"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <span />
        <span />
        <span />
      </button>

      <nav className={open ? "app-nav-open" : undefined}>
        <NavSection
          label="Daily operations"
          links={trackLinks}
          onNavigate={closeMenu}
          pathname={pathname}
          warmRoute={warmRoute}
        />
        <NavSection
          label="Manage"
          links={manageLinks}
          onNavigate={closeMenu}
          pathname={pathname}
          warmRoute={warmRoute}
        />
        <div className="app-nav-mobile-foot">
          {isPlatformAdmin ? (
            <Link className="app-platform-link" href="/internal" onClick={closeMenu}>
              Platform console
            </Link>
          ) : null}
          <form action={signOutAction}>
            <button className="app-signout app-signout-mobile" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {open ? (
        <button
          aria-label="Close menu"
          className="app-nav-backdrop"
          onClick={closeMenu}
          type="button"
        />
      ) : null}
    </>
  );
}
