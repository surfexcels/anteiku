"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { invalidateWasteCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";
import { QuickClosePanel } from "../waste/quick-close-panel";
import { WasteLogPanel } from "../waste/waste-log-panel";
import { DailyStockWasteBridge } from "./operations-connections";

type WasteMode = "quick" | "single";

export function DailyWasteSection({
  currencyCode,
  dayStatus,
  initialLogs,
  onRefresh,
  onGoToClosing,
  products,
  reasons,
  stockDate,
}: {
  currencyCode: string;
  dayStatus: "open" | "closed" | null;
  initialLogs: WasteLog[];
  onRefresh: () => Promise<void>;
  onGoToClosing: () => void;
  products: BusinessProduct[];
  reasons: WasteReason[];
  stockDate: string;
}) {
  const [mode, setMode] = useState<WasteMode>("quick");
  const [logs, setLogs] = useState(initialLogs);

  useEffect(() => {
    setLogs(initialLogs);
  }, [initialLogs]);

  const wasteCostMinor = useMemo(
    () => logs.reduce((sum, log) => sum + log.totalCostMinor, 0),
    [logs],
  );

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

  async function handleSaved(next: WasteLog[]) {
    setLogs((current) => [...next, ...current]);
    invalidateWasteCaches();
    await onRefresh();
  }

  return (
    <div className="daily-waste-section">
      <DailyStockWasteBridge
        currencyCode={currencyCode}
        dayStatus={dayStatus}
        stockDate={stockDate}
        wasteCostMinor={wasteCostMinor}
        wasteCount={logs.length}
      />

      <div className="daily-waste-mode-tabs">
        <button
          className={mode === "quick" ? "active" : undefined}
          onClick={() => setMode("quick")}
          type="button"
        >
          Quick close
        </button>
        <button
          className={mode === "single" ? "active" : undefined}
          onClick={() => setMode("single")}
          type="button"
        >
          Log one item
        </button>
        <Link className="waste-export-link" href="/dashboard/waste" prefetch>
          Full waste log -&gt;
        </Link>
      </div>

      {mode === "quick" ? (
        <QuickClosePanel
          currencyCode={currencyCode}
          onSaved={handleSaved}
          products={sortedProducts}
          reasons={reasons}
        />
      ) : (
        <WasteLogPanel
          currencyCode={currencyCode}
          onSaved={(log) => handleSaved([log])}
          products={products}
          reasons={reasons}
        />
      )}

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Today&apos;s entries</h2>
            <p>Only these rows count toward {stockDate} reconciliation.</p>
          </div>
          <span>{logs.length}</span>
        </div>
        {logs.length === 0 ? (
          <div className="empty-state-app compact">
            <strong>No waste for this date yet</strong>
            <p>Log spoilage and unsold items, then move to Closing stock.</p>
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
                          {log.wasteReasonLabel ? ` / ${log.wasteReasonLabel}` : ""}
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
        {dayStatus === "open" && (
          <button
            className="button primary full inventory-close-btn"
            onClick={onGoToClosing}
            type="button"
          >
            Continue to closing stock
          </button>
        )}
      </section>
    </div>
  );
}
