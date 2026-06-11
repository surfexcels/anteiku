"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  bootstrapUrlForPath,
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

const manageLinks: NavLink[] = [
  { href: "/dashboard/products", label: "Products", icon: "products" },
  { href: "/dashboard/insights", label: "Insights", icon: "insights" },
  { href: "/dashboard/reports", label: "Reports", icon: "reports" },
  { href: "/dashboard/imports", label: "Imports", icon: "imports" },
];

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

export function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function warmRoute(href: string) {
    const bootstrapUrl = bootstrapUrlForPath(href);
    const cacheKey = cacheKeyForPath(href);
    if (bootstrapUrl && cacheKey) {
      void prefetchDashboardBootstrap(bootstrapUrl, cacheKey);
    }
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label="Open menu"
        className="app-menu-toggle"
        onClick={() => setOpen((current) => !current)}
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
      </nav>

      {open && (
        <button
          aria-label="Close menu"
          className="app-nav-backdrop"
          onClick={closeMenu}
          type="button"
        />
      )}
    </>
  );
}
