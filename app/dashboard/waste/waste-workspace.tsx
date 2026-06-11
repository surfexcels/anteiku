"use client";

import { useMemo, useState, useTransition } from "react";
import { invalidateWasteCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";
import { EmptyStateVisual } from "../dashboard-icons";
import { QuickClosePanel } from "./quick-close-panel";
import { SpreadsheetImportPanel } from "./spreadsheet-import-panel";
import { WasteLogPanel } from "./waste-log-panel";

type Tab = "quick" | "single" | "import";

export function WasteWorkspace({
  currencyCode,
  initialLogs,
  products,
  reasons,
  variant = "hub",
}: {
  currencyCode: string;
  initialLogs: WasteLog[];
  products: BusinessProduct[];
  reasons: WasteReason[];
  variant?: "hub" | "embedded";
}) {
  const [tab, setTab] = useState<Tab>("quick");
  const [isPending, startTransition] = useTransition();
  const [logs, setLogs] = useState(initialLogs);

  const sortedProducts = useMemo(() => {
    const frequency = new Map<string, number>();
    for (const log of logs) {
      frequency.set(
        log.businessProductId,
        (frequency.get(log.businessProductId) ?? 0) + 1,
      );
    }

    return [...products].sort((left, right) => {
      const leftScore = frequency.get(left.id) ?? 0;
      const rightScore = frequency.get(right.id) ?? 0;
      if (leftScore !== rightScore) return rightScore - leftScore;
      return left.name.localeCompare(right.name);
    });
  }, [logs, products]);

  function switchTab(next: Tab) {
    startTransition(() => {
      setTab(next);
    });
  }

  function prependLogs(next: WasteLog[]) {
    setLogs((current) => [...next, ...current]);
    invalidateWasteCaches();
  }

  return (
    <div className={`waste-workspace${isPending ? " is-switching" : ""}`}>
      <div className="waste-tabs-row">
        <div className="waste-tabs" role="tablist">
          <button
            aria-selected={tab === "quick"}
            className={tab === "quick" ? "active" : undefined}
            onClick={() => switchTab("quick")}
            role="tab"
            type="button"
          >
            Quick close
          </button>
          <button
            aria-selected={tab === "single"}
            className={tab === "single" ? "active" : undefined}
            onClick={() => switchTab("single")}
            role="tab"
            type="button"
          >
            Log one item
          </button>
          <button
            aria-selected={tab === "import"}
            className={tab === "import" ? "active" : undefined}
            onClick={() => switchTab("import")}
            role="tab"
            type="button"
          >
            Import Excel
          </button>
        </div>
        <a className="waste-export-link" href="/api/waste-logs/export?days=30">
          Export CSV
        </a>
      </div>

      <div className="waste-tab-panels">
        <div className={tab === "quick" ? "waste-tab-panel active" : "waste-tab-panel"}>
          <QuickClosePanel
            currencyCode={currencyCode}
            onSaved={prependLogs}
            products={sortedProducts}
            reasons={reasons}
          />
        </div>
        <div className={tab === "single" ? "waste-tab-panel active" : "waste-tab-panel"}>
          <WasteLogPanel
            currencyCode={currencyCode}
            onSaved={(log) => prependLogs([log])}
            products={products}
            reasons={reasons}
          />
        </div>
        <div className={tab === "import" ? "waste-tab-panel active" : "waste-tab-panel"}>
          <SpreadsheetImportPanel onSaved={prependLogs} products={products} />
        </div>
      </div>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>{variant === "hub" ? "Full history" : "Recent entries"}</h2>
            <p>
              {variant === "hub"
                ? "All logged waste — use filters in export for accounting periods."
                : "Latest waste entries across dates."}
            </p>
          </div>
          <span>{logs.length}</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state-app">
            <EmptyStateVisual icon="waste" />
            <strong>No entries yet</strong>
            <p>Use Quick close at the end of the day instead of a spreadsheet row.</p>
          </div>
        ) : (
          <div className="waste-log-table-wrap">
            <table className="waste-log-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>When</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <div className="waste-log-product">
                        <strong>{log.productName}</strong>
                        <small>
                          {log.quantity} units
                          {log.wasteReasonLabel ? ` · ${log.wasteReasonLabel}` : ""}
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className="waste-log-date">
                        {new Date(log.occurredAt).toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <span className="waste-log-amount">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: log.currencyCode,
                        }).format(log.totalCostMinor / 100)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
