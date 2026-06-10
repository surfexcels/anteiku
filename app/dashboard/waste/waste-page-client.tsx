"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";
import { PageSkeleton } from "../page-skeleton";
import { WasteWorkspace } from "./waste-workspace";

interface WasteBootstrap {
  currencyCode: string;
  logs: WasteLog[];
  products: BusinessProduct[];
  reasons: WasteReason[];
}

export function WastePageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<WasteBootstrap>(
    DASHBOARD_CACHE.waste,
    DASHBOARD_BOOTSTRAP_URL.waste,
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
          <span className="app-kicker">WASTE LOG</span>
          <h1>Close the day in under 30 seconds.</h1>
          <p>
            Replace spreadsheet rows with quick close, or import your existing Excel log.
          </p>
        </div>
      </header>
      <WasteWorkspace
        currencyCode={data.currencyCode}
        initialLogs={data.logs}
        products={data.products}
        reasons={data.reasons}
      />
    </main>
  );
}
