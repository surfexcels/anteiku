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

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">REPORTS</span>
          <h1>Exportable waste summaries.</h1>
          <p>Review period totals and top wasted products.</p>
        </div>
      </header>
      <ReportsPanel currencyCode={data.currencyCode} initialReports={data.reports} />
    </main>
  );
}
