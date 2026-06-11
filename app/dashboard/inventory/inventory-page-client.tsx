"use client";

import { useCallback, useState } from "react";
import {
  inventoryBootstrapUrl,
  inventoryCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateInventoryCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { localDateKey } from "@/src/lib/date/local-date-key";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type {
  InventoryDayDetail,
  InventoryDaySummary,
} from "@/src/modules/inventory/domain/inventory";
import { PageSkeleton } from "../page-skeleton";
import { InventoryWorkspace } from "./inventory-workspace";

interface InventoryBootstrap {
  currencyCode: string;
  stockDate: string;
  products: BusinessProduct[];
  recentDays: InventoryDaySummary[];
  day: InventoryDayDetail | null;
  canCarryForward: boolean;
}

export function InventoryPageClient() {
  const [stockDate, setStockDate] = useState(() => localDateKey(new Date()));
  const cacheKey = inventoryCacheKey(stockDate);
  const url = inventoryBootstrapUrl(stockDate);

  const { data, error, isLoading, refresh } = useDashboardBootstrap<InventoryBootstrap>(
    cacheKey,
    url,
  );

  const onRefresh = useCallback(async () => {
    invalidateInventoryCaches(stockDate);
    await refresh();
  }, [refresh, stockDate]);

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

  const closedCount = data.recentDays.filter((day) => day.status === "closed").length;
  const openToday = data.day?.status === "open";

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Daily inventory</span>
          <h1>Opening stock, closing stock, waste reconciled.</h1>
          <p>
            Accountant-style day counts on your menu. Waste from your waste log is
            subtracted automatically — usage shows what was sold or consumed.
          </p>
        </div>
        <div className="waste-page-stats">
          <div className="waste-stat-pill">
            <div>
              <span>Today</span>
              <strong>{data.day ? (data.day.status === "closed" ? "Closed" : "Open") : "—"}</strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Closed days</span>
              <strong>{closedCount}</strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Menu items</span>
              <strong>{data.products.length}</strong>
            </div>
          </div>
        </div>
      </header>

      <InventoryWorkspace
        canCarryForward={data.canCarryForward}
        currencyCode={data.currencyCode}
        day={data.day}
        onDateChange={setStockDate}
        onRefresh={onRefresh}
        products={data.products}
        recentDays={data.recentDays}
        stockDate={stockDate}
        todayOpen={openToday}
      />
    </main>
  );
}
