"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { Report } from "@/src/modules/reports/domain/report";
import { PageSkeleton } from "../page-skeleton";
import { ReportsPanel } from "./reports-panel";

interface ReportsBootstrap {
  currencyCode: string;
  reports: Report[];
}

export function ReportsPageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<ReportsBootstrap>(
    DASHBOARD_CACHE.reports,
    DASHBOARD_BOOTSTRAP_URL.reports,
  );

  if (error) {
    return (
      <main className="dashboard-overview">
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="dashboard-overview">
        <PageSkeleton />
      </main>
    );
  }

  const totalWasteMinor = data.reports.reduce(
    (sum, r) => sum + r.summary.totalCostMinor,
    0,
  );
  const totalEntries = data.reports.reduce(
    (sum, r) => sum + r.summary.logCount,
    0,
  );

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Reports</span>
          <h1>Exportable waste summaries.</h1>
          <p>
            Generate period reports with totals, top products, and CSV export for
            your team or accountant.
          </p>
        </div>
        <div className="waste-page-stats">
          <div className="waste-stat-pill">
            <div>
              <span>Reports</span>
              <strong>{data.reports.length}</strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Total logged</span>
              <strong>
                {new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: data.currencyCode,
                  maximumFractionDigits: 0,
                }).format(totalWasteMinor / 100)}
              </strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Entries</span>
              <strong>{totalEntries}</strong>
            </div>
          </div>
        </div>
      </header>
      <ReportsPanel currencyCode={data.currencyCode} initialReports={data.reports} />
    </main>
  );
}
