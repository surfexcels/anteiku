"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyStateVisual } from "./dashboard-icons";
import { formatMoney } from "@/src/lib/format-money";
import {
  overviewBootstrapUrl,
  overviewCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { timeGreeting } from "@/src/lib/greeting";
import type { CarbonOverviewAnalytics } from "@/src/modules/sustainability/domain/carbon";
import type {
  BudgetPacing,
  DailyWasteTrend,
  OverviewAlert,
  PriceMover,
  SavingsOpportunity,
  WastePeriodComparison,
  WasteReasonBreakdown,
  WasteSummary,
} from "@/src/modules/waste/domain/waste";
import { BudgetPacingPanel } from "./budget-pacing";
import { CarbonImpactPanel } from "./carbon-impact-panel";
import { OverviewAlerts } from "./overview-alerts";
import { OverviewQuickActions } from "./overview-quick-actions";
import { PageSkeleton } from "./page-skeleton";
import { PriceMoversPanel } from "./price-movers-panel";
import { ReasonBreakdown } from "./reason-breakdown";
import { SavingsScorecard } from "./savings-scorecard";
import { WasteTrendChart } from "./waste-trend-chart";

interface OverviewBootstrap {
  businessName: string;
  currencyCode: string;
  periodDays: number;
  summary: WasteSummary;
  trend: DailyWasteTrend[];
  comparison: WastePeriodComparison;
  reasonBreakdown: WasteReasonBreakdown[];
  productCount: number;
  newInsights: number;
  savings: SavingsOpportunity;
  alerts: OverviewAlert[];
  budgetPacing: BudgetPacing;
  priceMovers: PriceMover[];
  dailyAverageMinor: number;
  avgPerEntryMinor: number;
  carbon: CarbonOverviewAnalytics;
  carbonEquivalencies: { carKm: number; smartphoneCharges: number };
}

export function OverviewPageClient() {
  const [periodDays, setPeriodDays] = useState(7);
  const cacheKey = overviewCacheKey(periodDays);
  const url = overviewBootstrapUrl(periodDays);

  const { data, error, isLoading } = useDashboardBootstrap<OverviewBootstrap>(
    cacheKey,
    url,
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
        <PageSkeleton tall />
      </main>
    );
  }

  const weekChange = data.comparison.changePercent;
  const periodLabel = data.periodDays === 30 ? "30 days" : "7 days";
  const carbonKg = (data.carbon.summary.totalCo2eG / 1000).toFixed(1);

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Operations overview</span>
          <h1>{timeGreeting()}, {data.businessName}.</h1>
          <p>
            Stock counts, supplier costs, waste, carbon, and margin signals —
            one dashboard for running the café, not just logging spoilage.
          </p>
        </div>
        <div className="overview-header-actions">
          <div className="period-toggle" role="group" aria-label="Reporting period">
            <button
              className={periodDays === 7 ? "active" : undefined}
              onClick={() => setPeriodDays(7)}
              type="button"
            >
              7 days
            </button>
            <button
              className={periodDays === 30 ? "active" : undefined}
              onClick={() => setPeriodDays(30)}
              type="button"
            >
              30 days
            </button>
          </div>
        </div>
      </header>

      <OverviewQuickActions />

      <OverviewAlerts alerts={data.alerts} />

      <section className="overview-hub-stats">
        <article className="metric-card-app">
          <span>Menu items</span>
          <strong>{data.productCount}</strong>
          <p>
            <Link href="/dashboard/products" prefetch>
              Manage menu & costs
            </Link>
          </p>
        </article>
        <article className="metric-card-app">
          <span>New insights</span>
          <strong>{data.newInsights}</strong>
          <p>
            <Link href="/dashboard/insights" prefetch>
              Review opportunities
            </Link>
          </p>
        </article>
        <article className="metric-card-app">
          <span>Waste · {periodLabel}</span>
          <strong>{formatMoney(data.summary.totalCostMinor, data.currencyCode)}</strong>
          <p>
            {data.summary.itemCount} entries
            {weekChange !== null && (
              <>
                {" "}
                ·{" "}
                <span className={weekChange <= 0 ? "metric-good-text" : "metric-bad-text"}>
                  {weekChange > 0 ? "+" : ""}
                  {weekChange}%
                </span>
              </>
            )}
          </p>
        </article>
        <article className="metric-card-app">
          <span>Carbon · {periodLabel}</span>
          <strong>{carbonKg} kg</strong>
          <p>
            <Link href="/dashboard/sustainability" prefetch>
              CO₂e from waste
            </Link>
          </p>
        </article>
      </section>

      <div className="overview-section-head">
        <h2>Margin & pacing</h2>
        <p>Budget run-rate and recoverable savings from waste patterns.</p>
      </div>

      <BudgetPacingPanel currencyCode={data.currencyCode} pacing={data.budgetPacing} />
      <SavingsScorecard currencyCode={data.currencyCode} savings={data.savings} />

      <div className="overview-section-head">
        <h2>Waste & carbon</h2>
        <p>Cost and environmental impact — tied to daily stock reconciliation.</p>
      </div>

      <CarbonImpactPanel
        carbon={data.carbon}
        equivalencies={data.carbonEquivalencies}
        periodDays={data.periodDays}
      />

      <WasteTrendChart
        currencyCode={data.currencyCode}
        periodDays={data.periodDays}
        periodTotalMinor={data.summary.totalCostMinor}
        trend={data.trend}
      />

      <div className="dashboard-split">
        <ReasonBreakdown
          breakdown={data.reasonBreakdown}
          currencyCode={data.currencyCode}
        />
        <section className="panel-app">
          <div className="panel-head-app">
            <div>
              <h2>Top wasted products</h2>
              <p>Highest cost drivers — {periodLabel}</p>
            </div>
          </div>
          {data.summary.topProducts.length === 0 ? (
            <div className="empty-state-app">
              <EmptyStateVisual icon="clipboard" />
              <strong>No waste logged yet</strong>
              <p>Set up your menu, then log waste during daily stock or in the waste log.</p>
              <Link className="button primary small" href="/dashboard/inventory" prefetch>
                Start daily stock
              </Link>
            </div>
          ) : (
            <div className="ranked-list ranked-list-detailed">
              {data.summary.topProducts.map((product, index) => {
                const share =
                  data.summary.totalCostMinor > 0
                    ? Math.round(
                        (product.totalCostMinor / data.summary.totalCostMinor) * 100,
                      )
                    : 0;
                return (
                  <div className="ranked-row-detailed" key={product.productName}>
                    <span className="rank-index">{index + 1}</span>
                    <div className="rank-body">
                      <div className="rank-row-head">
                        <strong>{product.productName}</strong>
                        <b>{formatMoney(product.totalCostMinor, data.currencyCode)}</b>
                      </div>
                      <div className="rank-bar-track">
                        <div className="rank-bar-fill" style={{ width: `${share}%` }} />
                      </div>
                      <small>
                        {product.quantity} units · {share}% of period waste
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      <div className="overview-section-head">
        <h2>Supplier costs</h2>
        <p>Recent price movement from invoice imports.</p>
      </div>

      <PriceMoversPanel currencyCode={data.currencyCode} movers={data.priceMovers} />
    </main>
  );
}
