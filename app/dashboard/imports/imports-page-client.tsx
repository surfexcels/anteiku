"use client";

import {
  DASHBOARD_BOOTSTRAP_URL,
  DASHBOARD_CACHE,
} from "@/src/lib/client/dashboard-cache-keys";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";
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
            Upload supplier PDFs or spreadsheets — OCR extracts costs and links them to
            your products.
          </p>
        </div>
        <div className="waste-page-stats">
          <div className="waste-stat-pill">
            <div>
              <span>Uploads</span>
              <strong>{data.imports.length}</strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Completed</span>
              <strong>{completed}</strong>
            </div>
          </div>
          <div className="waste-stat-pill">
            <div>
              <span>Lines matched</span>
              <strong>{matchedLines}</strong>
            </div>
          </div>
        </div>
      </header>
      <ImportsPanel initialImports={data.imports} />
    </main>
  );
}
