import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";
import type { Recommendation } from "@/src/modules/recommendations/domain/recommendation";
import type { OverviewAlert, PriceMover, WastePeriodComparison } from "@/src/modules/waste/domain/waste";

export function buildOverviewAlerts(input: {
  comparison: WastePeriodComparison;
  newInsights: number;
  recommendations: Recommendation[];
  imports: SupplierImport[];
  priceMovers: PriceMover[];
  periodDays: number;
}): OverviewAlert[] {
  const alerts: OverviewAlert[] = [];

  if (input.newInsights > 0) {
    alerts.push({
      id: "new-insights",
      severity: "info",
      title: `${input.newInsights} new insight${input.newInsights === 1 ? "" : "s"}`,
      message: "Review recommendations to recover margin this week.",
      href: "/dashboard/insights",
      actionLabel: "View insights",
    });
  }

  const change = input.comparison.changePercent;
  if (change !== null && change >= 20) {
    alerts.push({
      id: "waste-spike",
      severity: change >= 40 ? "critical" : "warning",
      title: "Waste cost is rising",
      message: `Up ${change}% vs the previous ${input.periodDays} days. Check your top wasted items.`,
      href: "/dashboard/waste",
      actionLabel: "Log waste",
    });
  }

  const topMover = input.priceMovers[0];
  if (topMover && topMover.changePercent !== null && topMover.changePercent >= 5) {
    alerts.push({
      id: "price-mover",
      severity: topMover.changePercent >= 15 ? "warning" : "info",
      title: `${topMover.productName} price moved`,
      message: `Supplier cost up ${topMover.changePercent}% on your latest invoice.`,
      href: "/dashboard/imports",
      actionLabel: "Review imports",
    });
  }

  const failedImport = input.imports.find((entry) => entry.status === "failed");
  if (failedImport) {
    alerts.push({
      id: "import-failed",
      severity: "warning",
      title: "Invoice import failed",
      message: failedImport.errorMessage ?? "Re-upload the supplier file to refresh costs.",
      href: "/dashboard/imports",
      actionLabel: "Open imports",
    });
  }

  const urgent = input.recommendations.find(
    (item) => item.status === "new" && item.estimatedAnnualImpactMinor >= 50000,
  );
  if (urgent) {
    alerts.push({
      id: `insight-${urgent.id}`,
      severity: "warning",
      title: urgent.title,
      message: urgent.explanation,
      href: "/dashboard/insights",
      actionLabel: "Review",
    });
  }

  return alerts.slice(0, 4);
}
