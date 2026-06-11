"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { Recommendation } from "@/src/modules/recommendations/domain/recommendation";
import { PageHeaderStats } from "../page-header-stats";
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

  const newCount = data.recommendations.filter((r) => r.status === "new").length;
  const acceptedCount = data.recommendations.filter(
    (r) => r.status === "accepted",
  ).length;
  const potentialSavings = data.recommendations
    .filter((r) => r.status !== "dismissed")
    .reduce((sum, r) => sum + r.estimatedAnnualImpactMinor, 0);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Insights</span>
          <h1>Turn waste data into action.</h1>
          <p>
            AI-backed recommendations with estimated annual savings — accept what
            you&apos;ll implement.
          </p>
        </div>
        <PageHeaderStats
          items={[
            {
              label: "New",
              value: newCount,
              tone: newCount > 0 ? "active" : "muted",
            },
            {
              label: "Accepted",
              value: acceptedCount,
              tone: acceptedCount > 0 ? "positive" : "default",
            },
            {
              label: "Potential / yr",
              value: new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: data.currencyCode,
                maximumFractionDigits: 0,
              }).format(potentialSavings / 100),
              compact: true,
            },
          ]}
        />
      </header>
      <InsightsPanel
        currencyCode={data.currencyCode}
        initialRecommendations={data.recommendations}
      />
    </main>
  );
}
