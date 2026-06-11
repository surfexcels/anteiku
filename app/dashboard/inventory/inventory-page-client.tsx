"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";
import {
  defaultDailyStockTab,
  parseDailyStockTab,
  type DailyStockTab,
} from "../daily-stock/daily-stock-tabs";
import {
  formatHeaderDate,
  PageHeaderStats,
} from "../page-header-stats";
import { PageSkeleton } from "../page-skeleton";
import { InventoryWorkspace } from "./inventory-workspace";

interface InventoryBootstrap {
  currencyCode: string;
  stockDate: string;
  nextStockDate: string;
  products: BusinessProduct[];
  recentDays: InventoryDaySummary[];
  day: InventoryDayDetail | null;
  priorDay: InventoryDayDetail | null;
  canCarryForward: boolean;
  wasteLogs: WasteLog[];
  wasteReasons: WasteReason[];
}

export function InventoryPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateFromUrl = searchParams.get("date");
  const tabFromUrl = parseDailyStockTab(searchParams.get("tab"));

  const [stockDate, setStockDate] = useState(
    () => dateFromUrl ?? localDateKey(new Date()),
  );
  const [activeTab, setActiveTab] = useState<DailyStockTab>("opening");

  const cacheKey = inventoryCacheKey(stockDate);
  const url = inventoryBootstrapUrl(stockDate);

  const { data, error, isLoading, refresh } = useDashboardBootstrap<InventoryBootstrap>(
    cacheKey,
    url,
  );

  const dayStatus = data?.day?.status ?? null;

  useEffect(() => {
    if (dateFromUrl && dateFromUrl !== stockDate) {
      setStockDate(dateFromUrl);
    }
  }, [dateFromUrl, stockDate]);

  useEffect(() => {
    if (!data) return;
    const nextTab = tabFromUrl ?? defaultDailyStockTab(dayStatus);
    setActiveTab(nextTab);
  }, [data, dayStatus, tabFromUrl, stockDate]);

  const syncUrl = useCallback(
    (date: string, tab: DailyStockTab) => {
      router.replace(`/dashboard/inventory?date=${date}&tab=${tab}`, {
        scroll: false,
      });
    },
    [router],
  );

  const onDateChange = useCallback(
    (date: string) => {
      setStockDate(date);
      const tab = defaultDailyStockTab(null);
      setActiveTab(tab);
      syncUrl(date, tab);
      invalidateInventoryCaches(date);
    },
    [syncUrl],
  );

  const onTabChange = useCallback(
    (tab: DailyStockTab) => {
      setActiveTab(tab);
      syncUrl(stockDate, tab);
    },
    [stockDate, syncUrl],
  );

  const onRefresh = useCallback(async () => {
    invalidateInventoryCaches(stockDate);
    await refresh();
  }, [refresh, stockDate]);

  const onStartNextDay = useCallback(() => {
    if (!data) return;
    setStockDate(data.nextStockDate);
    setActiveTab("opening");
    syncUrl(data.nextStockDate, "opening");
    invalidateInventoryCaches(data.nextStockDate);
  }, [data, syncUrl]);

  const closedCount = useMemo(
    () => data?.recentDays.filter((day) => day.status === "closed").length ?? 0,
    [data],
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

  const openToday = data.day?.status === "open";
  const sessionStatus = data.day
    ? data.day.status === "closed"
      ? "Closed"
      : "Open"
    : "Not started";
  const sessionTone = data.day
    ? data.day.status === "closed"
      ? "positive"
      : "active"
    : "muted";

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Daily stock</span>
          <h1>Opening, waste, and closing in one flow.</h1>
          <p>
            Count at open, log today&apos;s waste, close at night — closing stock
            carries forward as the next morning&apos;s opening. For full history
            and Excel import, use{" "}
            <Link href="/dashboard/waste" prefetch>Waste log</Link>.
          </p>
        </div>
        <PageHeaderStats
          items={[
            {
              label: formatHeaderDate(stockDate),
              value: sessionStatus,
              tone: sessionTone,
            },
            {
              label: "Closed days",
              value: closedCount,
            },
            {
              label: "Waste entries",
              value: data.wasteLogs.length,
            },
          ]}
        />
      </header>

      <InventoryWorkspace
        activeTab={activeTab}
        canCarryForward={data.canCarryForward}
        currencyCode={data.currencyCode}
        day={data.day}
        nextStockDate={data.nextStockDate}
        onDateChange={onDateChange}
        onRefresh={onRefresh}
        onStartNextDay={onStartNextDay}
        onTabChange={onTabChange}
        priorDay={data.priorDay}
        products={data.products}
        recentDays={data.recentDays}
        stockDate={stockDate}
        todayOpen={openToday}
        wasteLogs={data.wasteLogs}
        wasteReasons={data.wasteReasons}
      />
    </main>
  );
}
