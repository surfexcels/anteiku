"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon } from "./nav-icons";

const tabs: Array<{
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}> = [
  { href: "/dashboard/floor", label: "Floor", icon: "floor" },
  { href: "/dashboard/inventory", label: "Stock", icon: "inventory" },
  { href: "/dashboard/waste", label: "Waste", icon: "waste" },
  { href: "/dashboard", label: "Home", icon: "overview", exact: true },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardMobileBar({
  onOpenMenu,
}: {
  onOpenMenu: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Quick navigation" className="app-mobile-bar">
      {tabs.map((tab) => (
        <Link
          className={isActive(pathname, tab.href, tab.exact) ? "active" : undefined}
          href={tab.href}
          key={tab.href}
          prefetch
        >
          <span className="app-mobile-bar-icon">
            <NavIcon name={tab.icon} />
          </span>
          {tab.label}
        </Link>
      ))}
      <button
        aria-label="Open full menu"
        className={pathname.startsWith("/dashboard/settings") ? "active" : undefined}
        onClick={onOpenMenu}
        type="button"
      >
        <span className="app-mobile-bar-icon">
          <NavIcon name="settings" />
        </span>
        Menu
      </button>
    </nav>
  );
}
