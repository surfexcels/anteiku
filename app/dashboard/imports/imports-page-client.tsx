"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";
import { PageHeaderStats } from "../page-header-stats";
import { PageSkeleton } from "../page-skeleton";
import { ImportsPanel } from "./imports-panel";

interface ImportsBootstrap {
  imports: SupplierImport[];
}

export function ImportsPageClient() {
  const { data, error, isLoading } = useDashboardBootstrap<ImportsBootstrap>(
    DASHBOARD_CACHE.imports,
    DASHBOARD_BOOTSTRAP_URL.imports,
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

  const completed = data.imports.filter((i) => i.status === "completed").length;
  const matchedLines = data.imports.reduce(
    (sum, item) => sum + (item.result?.matchedCount ?? 0),
    0,
  );

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Supplier imports</span>
          <h1>Match invoices to your menu.</h1>
          <p>
            Upload supplier PDFs or spreadsheets — we read line items and link costs to
            your menu.
          </p>
        </div>
        <PageHeaderStats
          items={[
            { label: "Uploads", value: data.imports.length },
            {
              label: "Completed",
              value: completed,
              tone: completed > 0 ? "positive" : "muted",
            },
            { label: "Lines matched", value: matchedLines },
          ]}
        />
      </header>
      <ImportsPanel initialImports={data.imports} />
    </main>
  );
}
