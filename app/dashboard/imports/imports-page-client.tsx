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

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">SUPPLIER IMPORTS</span>
          <h1>Match invoices to your menu.</h1>
          <p>Queue supplier files for product and cost matching.</p>
        </div>
      </header>
      <ImportsPanel initialImports={data.imports} />
    </main>
  );
}
