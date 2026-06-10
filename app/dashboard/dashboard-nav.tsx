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

function cacheKeyForPath(pathname: string) {
  if (pathname === "/dashboard") return overviewCacheKey(7);
  if (pathname.startsWith("/dashboard/products")) return DASHBOARD_CACHE.products;
  if (pathname.startsWith("/dashboard/waste")) return DASHBOARD_CACHE.waste;
  if (pathname.startsWith("/dashboard/insights")) return DASHBOARD_CACHE.insights;
  if (pathname.startsWith("/dashboard/reports")) return DASHBOARD_CACHE.reports;
  if (pathname.startsWith("/dashboard/imports")) return DASHBOARD_CACHE.imports;
  if (pathname.startsWith("/dashboard/sustainability")) return sustainabilityCacheKey(7);
  return null;
}

type NavLink = { href: string; label: string; exact?: boolean };

const links: NavLink[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/waste", label: "Waste log" },
  { href: "/dashboard/sustainability", label: "Carbon" },
  { href: "/dashboard/insights", label: "Insights" },
  { href: "/dashboard/reports", label: "Reports" },
  { href: "/dashboard/imports", label: "Imports" },
];

function isActive(pathname: string, link: NavLink) {
  if (link.exact) return pathname === link.href;
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export function DashboardNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function warmRoute(href: string) {
    const bootstrapUrl = bootstrapUrlForPath(href);
    const cacheKey = cacheKeyForPath(href);
    if (bootstrapUrl && cacheKey) {
      prefetchDashboardBootstrap(bootstrapUrl, cacheKey);
    }
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
        {links.map((link) => (
          <Link
            className={isActive(pathname, link) ? "active" : undefined}
            href={link.href}
            key={link.href}
            onClick={() => setOpen(false)}
            onMouseEnter={() => warmRoute(link.href)}
            onFocus={() => warmRoute(link.href)}
            prefetch
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {open && (
        <button
          aria-label="Close menu"
          className="app-nav-backdrop"
          onClick={() => setOpen(false)}
          type="button"
        />
      )}
    </>
  );
}
