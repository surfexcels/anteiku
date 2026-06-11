"use client";

import { useMemo } from "react";
import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { formatMoney } from "@/src/lib/format-money";
import { localDateKey } from "@/src/lib/date/local-date-key";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type {
  DailyWasteTrend,
  WasteLog,
  WastePeriodComparison,
  WasteReason,
  WasteReasonBreakdown,
  WasteSummary,
} from "@/src/modules/waste/domain/waste";
import { WasteLogDailyStockBridge } from "../daily-stock/operations-connections";
import { PageHeaderStats } from "../page-header-stats";
import { PageSkeleton } from "../page-skeleton";
import { WasteTrendChart } from "../waste-trend-chart";
import { WasteWorkspace } from "./waste-workspace";

interface WasteBootstrap {
  currencyCode: string;
  stockDate: string;
  logs: WasteLog[];
  products: BusinessProduct[];
  reasons: WasteReason[];
  summary: WasteSummary;
  trend: DailyWasteTrend[];
  reasonBreakdown: WasteReasonBreakdown[];
  comparison: WastePeriodComparison;
  inventoryDayStatus: "open" | "closed" | null;
}

function formatChange(comparison: WastePeriodComparison) {
  if (comparison.changePercent === null) return "—";
  const sign = comparison.changePercent > 0 ? "+" : "";
  return `${sign}${comparison.changePercent.toFixed(0)}%`;
}

export function WastePageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<WasteBootstrap>(
    DASHBOARD_CACHE.waste,
    DASHBOARD_BOOTSTRAP_URL.waste,
  );

  const today = localDateKey(new Date());

  const logsForToday = useMemo(() => {
    if (!data) return [];
    return data.logs.filter(
      (log) => localDateKey(new Date(log.occurredAt)) === today,
    );
  }, [data, today]);

  const todayTotalMinor = useMemo(
    () => logsForToday.reduce((sum, log) => sum + log.totalCostMinor, 0),
    [logsForToday],
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

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Waste log</span>
          <h1>Your full waste ledger and imports.</h1>
          <p>
            Browse history, bulk import spreadsheets, and export — separate from
            the quick logging on Daily stock, which only feeds today&apos;s
            reconciliation.
          </p>
        </div>
        <PageHeaderStats
          items={[
            {
              label: "7-day total",
              value: formatMoney(data.summary.totalCostMinor, data.currencyCode),
              compact: true,
            },
            {
              label: "vs prior week",
              value: formatChange(data.comparison),
              tone:
                data.comparison.changePercent === null
                  ? "muted"
                  : data.comparison.changePercent > 0
                    ? "negative"
                    : "positive",
            },
            {
              label: "All entries",
              value: data.logs.length,
            },
          ]}
        />
      </header>

      <WasteLogDailyStockBridge
        currencyCode={data.currencyCode}
        inventoryDayStatus={data.inventoryDayStatus}
        stockDate={today}
        todayWasteCostMinor={todayTotalMinor}
        todayWasteCount={logsForToday.length}
      />

      <WasteTrendChart
        currencyCode={data.currencyCode}
        periodTotalMinor={data.summary.totalCostMinor}
        trend={data.trend}
      />

      <div className="waste-hub-details dashboard-split">
        <section className="panel-app">
          <div className="panel-head-app">
            <div>
              <h2>Top wasted products</h2>
              <p>Last 7 days by cost</p>
            </div>
          </div>
          {data.summary.topProducts.length === 0 ? (
            <p className="panel-empty-copy">No waste recorded yet.</p>
          ) : (
            <ul className="waste-hub-list">
              {data.summary.topProducts.map((item) => (
                <li key={item.productName}>
                  <strong>{item.productName}</strong>
                  <span>
                    {formatMoney(item.totalCostMinor, data.currencyCode)} ·{" "}
                    {item.quantity} units
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel-app">
          <div className="panel-head-app">
            <div>
              <h2>By reason</h2>
              <p>Why items left the shelf</p>
            </div>
          </div>
          {data.reasonBreakdown.length === 0 ? (
            <p className="panel-empty-copy">Reason labels appear after you log waste.</p>
          ) : (
            <ul className="waste-hub-list">
              {data.reasonBreakdown.map((item) => (
                <li key={item.reasonLabel}>
                  <strong>{item.reasonLabel}</strong>
                  <span>
                    {formatMoney(item.totalCostMinor, data.currencyCode)} ·{" "}
                    {item.itemCount} entries
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <WasteWorkspace
        currencyCode={data.currencyCode}
        initialLogs={data.logs}
        products={data.products}
        reasons={data.reasons}
        variant="hub"
      />
    </main>
  );
}
