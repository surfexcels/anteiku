"use client";

import Link from "next/link";
import { ConnectionIconTile, type DashboardIconName } from "./dashboard-icons";

const ACTIONS: Array<{
  href: string;
  icon: DashboardIconName;
  label: string;
  description: string;
}> = [
  {
    href: "/dashboard/inventory",
    icon: "inventory",
    label: "Daily stock",
    description: "Opening counts, waste, closing, and handoff",
  },
  {
    href: "/dashboard/products",
    icon: "products",
    label: "Menu & costs",
    description: "Products, prices, and unit economics",
  },
  {
    href: "/dashboard/imports",
    icon: "imports",
    label: "Supplier imports",
    description: "Invoice upload and price matching",
  },
  {
    href: "/dashboard/insights",
    icon: "insights",
    label: "Insights",
    description: "Savings and margin opportunities",
  },
  {
    href: "/dashboard/reports",
    icon: "reports",
    label: "Reports",
    description: "Exports for review and accounting",
  },
];

export function OverviewQuickActions() {
  return (
    <section className="overview-quick-actions">
      <div className="overview-section-head">
        <h2>Today&apos;s workflows</h2>
        <p>Jump into the work — navigation stays in the sidebar.</p>
      </div>
      <div className="overview-quick-actions-grid">
        {ACTIONS.map((action) => (
          <Link className="overview-action-card" href={action.href} key={action.href} prefetch>
            <ConnectionIconTile icon={action.icon} />
            <div>
              <strong>{action.label}</strong>
              <p>{action.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
