"use client";

import Link from "next/link";
import { useState } from "react";
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

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Command center</span>
          <h1>{timeGreeting()}.</h1>
          <p>
            Real-time margin leakage at {data.businessName} — waste, costs, and
            what to fix next.
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
          <Link className="button primary small" href="/dashboard/waste" prefetch>
            Quick close
          </Link>
        </div>
      </header>

      <OverviewAlerts alerts={data.alerts} />

      <section className="metric-grid-app metric-grid-overview">
        <article className="metric-card-app featured">
          <span>Waste cost ({periodLabel})</span>
          <strong>{formatMoney(data.summary.totalCostMinor, data.currencyCode)}</strong>
          <p>
            {data.summary.itemCount} entries
            {weekChange !== null && (
              <>
                {" "}
                ·{" "}
                <span className={weekChange <= 0 ? "metric-good" : "metric-bad"}>
                  {weekChange > 0 ? "+" : ""}
                  {weekChange}% vs prior period
                </span>
              </>
            )}
          </p>
        </article>
        <article className="metric-card-app">
          <span>Daily average</span>
          <strong>{formatMoney(data.dailyAverageMinor, data.currencyCode)}</strong>
          <p>Run rate across {periodLabel}</p>
        </article>
        <article className="metric-card-app">
          <span>Avg per entry</span>
          <strong>{formatMoney(data.avgPerEntryMinor, data.currencyCode)}</strong>
          <p>Cost per waste log</p>
        </article>
        <article className="metric-card-app">
          <span>Menu items</span>
          <strong>{data.productCount}</strong>
          <p>
            <Link href="/dashboard/products" prefetch>
              Manage products
            </Link>
          </p>
        </article>
        <article className="metric-card-app">
          <span>New insights</span>
          <strong>{data.newInsights}</strong>
          <p>
            <Link href="/dashboard/insights" prefetch>
              View insights
            </Link>
          </p>
        </article>
      </section>

      <BudgetPacingPanel currencyCode={data.currencyCode} pacing={data.budgetPacing} />

      <CarbonImpactPanel
        carbon={data.carbon}
        equivalencies={data.carbonEquivalencies}
        periodDays={data.periodDays}
      />

      <WasteTrendChart
        currencyCode={data.currencyCode}
        periodDays={data.periodDays}
        trend={data.trend}
      />
      <SavingsScorecard currencyCode={data.currencyCode} savings={data.savings} />

      <div className="dashboard-split">
        <ReasonBreakdown
          breakdown={data.reasonBreakdown}
          currencyCode={data.currencyCode}
        />
        <section className="panel-app">
          <div className="panel-head-app">
            <div>
              <h2>Where your money went</h2>
              <p>Top wasted products — {periodLabel}</p>
            </div>
          </div>
          {data.summary.topProducts.length === 0 ? (
            <div className="empty-state-app">
              <strong>No waste logged yet</strong>
              <p>Add products to your menu, then log today&apos;s waste.</p>
              <Link className="button primary small" href="/dashboard/waste" prefetch>
                Log first entry
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

      <PriceMoversPanel currencyCode={data.currencyCode} movers={data.priceMovers} />
    </main>
  );
}
