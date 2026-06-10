"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { Recommendation } from "@/src/modules/recommendations/domain/recommendation";
import { PageSkeleton } from "../page-skeleton";
import { InsightsPanel } from "./insights-panel";

interface InsightsBootstrap {
  currencyCode: string;
  recommendations: Recommendation[];
}

export function InsightsPageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<InsightsBootstrap>(
    DASHBOARD_CACHE.insights,
    DASHBOARD_BOOTSTRAP_URL.insights,
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
          <span className="app-kicker">INSIGHTS</span>
          <h1>Turn waste data into action.</h1>
          <p>Each recommendation includes an estimated financial impact.</p>
        </div>
      </header>
      <InsightsPanel
        currencyCode={data.currencyCode}
        initialRecommendations={data.recommendations}
      />
    </main>
  );
}
