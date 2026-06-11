"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/src/lib/format-money";
import { localDateKey } from "@/src/lib/date/local-date-key";
import { invalidateInventoryCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { normalizeQuantity } from "@/src/lib/inventory/quantity-step";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type {
  InventoryDayDetail,
  InventoryDaySummary,
} from "@/src/modules/inventory/domain/inventory";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";
import {
  DailyStockTabs,
  type DailyStockTab,
} from "../daily-stock/daily-stock-tabs";
import { DailyWasteSection } from "../daily-stock/daily-waste-section";
import {
  StockHandoffBanner,
  StockHandoffNextDay,
} from "../daily-stock/stock-handoff-banner";
import { EmptyStateVisual, StatusDot } from "../dashboard-icons";
import { InventoryQuantityStepper } from "./inventory-quantity-stepper";

type Quantities = Record<string, { opening: number; closing: number }>;

type DailyStockFlowState = {
  currentStep: string;
  nextAction: string;
  nextTab: DailyStockTab | null;
  progressLabel: string;
  statusLabel: string;
};

function buildQuantities(
  products: BusinessProduct[],
  day: InventoryDayDetail | null,
): Quantities {
  const map: Quantities = {};
  for (const product of products) {
    const line = day?.lines.find(
      (item) => item.businessProductId === product.id,
    );
    map[product.id] = {
      opening: normalizeQuantity(line?.openingQuantity ?? 0, product.unit),
      closing: normalizeQuantity(line?.closingQuantity ?? 0, product.unit),
    };
  }
  return map;
}

export function InventoryWorkspace({
  activeTab,
  canCarryForward,
  currencyCode,
  day,
  nextStockDate,
  onDateChange,
  onRefresh,
  onTabChange,
  onStartNextDay,
  priorDay,
  products,
  recentDays,
  stockDate,
  todayOpen,
  wasteLogs,
  wasteReasons,
}: {
  activeTab: DailyStockTab;
  stockDate: string;
  nextStockDate: string;
  currencyCode: string;
  products: BusinessProduct[];
  day: InventoryDayDetail | null;
  priorDay: InventoryDayDetail | null;
  recentDays: InventoryDaySummary[];
  canCarryForward: boolean;
  todayOpen: boolean;
  wasteLogs: WasteLog[];
  wasteReasons: WasteReason[];
  onDateChange: (date: string) => void;
  onTabChange: (tab: DailyStockTab) => void;
  onStartNextDay: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [quantities, setQuantities] = useState<Quantities>(() =>
    buildQuantities(products, day),
  );
  const [carryForward, setCarryForward] = useState(canCarryForward);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  useEffect(() => {
    setQuantities(buildQuantities(products, day));
    setCarryForward(canCarryForward);
  }, [products, day, canCarryForward, stockDate]);

  const isClosed = day?.status === "closed";
  const isToday = stockDate === localDateKey(new Date());
  const dayStatus = day?.status ?? null;
  const reconciliation = useMemo(() => day?.lines ?? [], [day]);
  const flowState = getDailyStockFlowState({
    activeTab,
    dayStatus,
    hasProducts: products.length > 0,
    wasteCount: wasteLogs.length,
  });
  const flowNextTab = flowState.nextTab;

  function setQuantity(
    productId: string,
    field: "opening" | "closing",
    value: number,
  ) {
    const unit = products.find((p) => p.id === productId)?.unit ?? "item";
    setQuantities((current) => ({
      ...current,
      [productId]: {
        opening: current[productId]?.opening ?? 0,
        closing: current[productId]?.closing ?? 0,
        [field]: normalizeQuantity(value, unit),
      },
    }));
  }

  function linePayload() {
    return products.map((product) => ({
      businessProductId: product.id,
      openingQuantity: quantities[product.id]?.opening ?? 0,
      closingQuantity: quantities[product.id]?.closing ?? 0,
    }));
  }

  async function openDay() {
    if (products.length === 0) {
      setMessage("Add menu products before starting inventory.");
      setMessageTone("error");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/inventory/days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stockDate,
        carryForward,
        lines: linePayload().map((line) => ({
          businessProductId: line.businessProductId,
          openingQuantity: line.openingQuantity,
        })),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not open inventory day.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    invalidateInventoryCaches(stockDate);
    await onRefresh();
    setSaving(false);
    setMessageTone("success");
    setMessage("Opening stock saved. Log waste, then enter closing counts.");
    onTabChange("waste");
  }

  async function saveOpening() {
    if (!day) return;

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/inventory/days/${day.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "opening",
        lines: linePayload().map((line) => ({
          businessProductId: line.businessProductId,
          openingQuantity: line.openingQuantity,
        })),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not save opening stock.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    invalidateInventoryCaches(stockDate);
    await onRefresh();
    setSaving(false);
    setMessageTone("success");
    setMessage("Opening stock updated.");
  }

  async function closeDay() {
    if (!day) return;

    setSaving(true);
    setMessage("");

    const response = await fetch(`/api/inventory/days/${day.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "close",
        lines: linePayload(),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not close inventory day.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    invalidateInventoryCaches(stockDate);
    await onRefresh();
    setSaving(false);
    setMessageTone("success");
    setMessage("Day closed. Review the summary or start tomorrow.");
    onTabChange("summary");
  }

  return (
    <div className="inventory-workspace">
      <div className="inventory-toolbar">
        <label className="inventory-date-picker">
          <span>Stock date</span>
          <input
            onChange={(event) => onDateChange(event.target.value)}
            type="date"
            value={stockDate}
          />
        </label>
        <div className="inventory-recent-days">
          {recentDays.slice(0, 7).map((item) => (
            <button
              className={item.stockDate === stockDate ? "active" : undefined}
              key={item.id}
              onClick={() => onDateChange(item.stockDate)}
              type="button"
            >
              {item.stockDate.slice(5)}
              <StatusDot closed={item.status === "closed"} />
            </button>
          ))}
        </div>
      </div>

      <DailyStockTabs
        activeTab={activeTab}
        dayStatus={dayStatus}
        onTabChange={onTabChange}
        stockDate={stockDate}
      />

      <DailyStockFlowGuide
        currentStep={flowState.currentStep}
        nextAction={flowState.nextAction}
        onNext={flowNextTab ? () => onTabChange(flowNextTab) : undefined}
        progressLabel={flowState.progressLabel}
        statusLabel={flowState.statusLabel}
      />

      {activeTab === "opening" && (
        <div className="daily-stock-tab-panel active">
          <StockHandoffBanner priorDay={priorDay} stockDate={stockDate} />

          {!day ? (
            <section className="panel-app">
              <div className="panel-head-app">
                <div>
                  <h2>Opening stock</h2>
                  <p>
                    Count what you have at the start of {stockDate}. Use
                    yesterday&apos;s closing counts when carry forward is on.
                  </p>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="empty-state-app">
                  <EmptyStateVisual icon="inventory" />
                  <strong>Add products to your menu first</strong>
                  <p>Inventory lines are built from your active menu items.</p>
                  <Link className="button primary small" href="/dashboard/products" prefetch>
                    Set up menu
                  </Link>
                </div>
              ) : (
                <>
                  {canCarryForward && (
                    <label className="checkbox-field inventory-carry-forward">
                      <input
                        checked={carryForward}
                        onChange={(event) => setCarryForward(event.target.checked)}
                        type="checkbox"
                      />
                      Use yesterday&apos;s closing counts as today&apos;s opening stock
                    </label>
                  )}
                  <InventoryQuantityGrid
                    currencyCode={currencyCode}
                    disabled={saving}
                    field="opening"
                    products={products}
                    quantities={quantities}
                    setQuantity={setQuantity}
                  />
                  <button
                    className="button primary full"
                    disabled={saving}
                    onClick={openDay}
                    type="button"
                  >
                    {saving ? "Saving..." : "Save opening stock"}
                  </button>
                </>
              )}
            </section>
          ) : (
            <section className="panel-app">
              <div className="panel-head-app">
                <div>
                  <h2>Opening stock</h2>
                  <p>
                    {isClosed
                      ? "This day is closed - opening counts are locked."
                      : "Adjust if counts changed after you opened the day."}
                  </p>
                </div>
                <span className={`status-pill ${day.status}`}>{day.status}</span>
              </div>
              {!isClosed ? (
                <>
                  <InventoryQuantityGrid
                    currencyCode={currencyCode}
                    disabled={saving}
                    field="opening"
                    products={products}
                    quantities={quantities}
                    setQuantity={setQuantity}
                  />
                  <button
                    className="button ghost full"
                    disabled={saving}
                    onClick={saveOpening}
                    type="button"
                  >
                    {saving ? "Saving..." : "Update opening stock"}
                  </button>
                </>
              ) : (
                <InventoryQuantityGrid
                  currencyCode={currencyCode}
                  disabled
                  field="opening"
                  products={products}
                  quantities={quantities}
                  setQuantity={setQuantity}
                />
              )}
            </section>
          )}
        </div>
      )}

      {activeTab === "waste" && (
        <div className="daily-stock-tab-panel active">
          {!day && (
            <div className="daily-stock-tab-notice">
              <p>
                Save opening stock first so waste reconciles with your counts.{" "}
                <button
                  className="link-button"
                  onClick={() => onTabChange("opening")}
                  type="button"
                >
                  Go to opening
                </button>
              </p>
            </div>
          )}
          <DailyWasteSection
            currencyCode={currencyCode}
            dayStatus={dayStatus}
            initialLogs={wasteLogs}
            onGoToClosing={() => onTabChange("closing")}
            onRefresh={onRefresh}
            products={products}
            reasons={wasteReasons}
            stockDate={stockDate}
          />
        </div>
      )}

      {activeTab === "closing" && (
        <div className="daily-stock-tab-panel active">
          {!day ? (
            <div className="empty-state-app">
              <strong>Start with opening stock</strong>
              <p>Enter opening counts before you can close the day.</p>
              <button
                className="button primary small"
                onClick={() => onTabChange("opening")}
                type="button"
              >
                Opening stock
              </button>
            </div>
          ) : isClosed ? (
            <div className="daily-stock-tab-notice">
              <p>
                This day is already closed.{" "}
                <button
                  className="link-button"
                  onClick={() => onTabChange("summary")}
                  type="button"
                >
                  View summary
                </button>
              </p>
            </div>
          ) : (
            <>
              <section className="inventory-formula-banner">
                <strong>Before you close</strong>
                <p>
                  Log any remaining waste in the{" "}
                  <button
                    className="link-button"
                    onClick={() => onTabChange("waste")}
                    type="button"
                  >
                    Waste tab
                  </button>
                  . Then count what&apos;s left on the shelf.
                </p>
              </section>
              <section className="panel-app">
                <div className="panel-head-app">
                  <div>
                    <h2>Closing stock</h2>
                    <p>
                      What&apos;s on hand at end of day. These counts can carry
                      forward as tomorrow&apos;s opening.
                    </p>
                  </div>
                </div>
                <InventoryQuantityGrid
                  currencyCode={currencyCode}
                  disabled={saving}
                  field="closing"
                  products={products}
                  quantities={quantities}
                  setQuantity={setQuantity}
                />
                <button
                  className="button primary full inventory-close-btn"
                  disabled={saving}
                  onClick={closeDay}
                  type="button"
                >
                  {saving ? "Closing..." : "Close day with these counts"}
                </button>
              </section>
            </>
          )}
        </div>
      )}

      {activeTab === "summary" && (
        <div className="daily-stock-tab-panel active">
          {!day ? (
            <div className="empty-state-app">
              <strong>No stock session for this date</strong>
              <p>Open the day to see reconciliation here after closing.</p>
              <button
                className="button primary small"
                onClick={() => onTabChange("opening")}
                type="button"
              >
                Opening stock
              </button>
            </div>
          ) : (
            <>
              <section className="inventory-formula-banner">
                <strong>Reconciliation</strong>
                <p>
                  <span>Usage (sold / consumed)</span> = Opening - Closing - Waste
                </p>
              </section>

              <section className="panel-app inventory-reconciliation-panel">
                <div className="panel-head-app">
                  <div>
                    <h2>Day summary</h2>
                    <p>
                      {isClosed
                        ? "Closed day - opening, waste, closing, and implied usage."
                        : "Live preview - close the day to lock these numbers."}
                    </p>
                  </div>
                  <div className="inventory-export-actions">
                    <a
                      className="button ghost small"
                      href={`/api/inventory/days/${day.id}/export?format=csv`}
                    >
                      Export CSV
                    </a>
                    <a
                      className="button ghost small"
                      href={`/api/inventory/days/${day.id}/export?format=xls`}
                    >
                      Export Excel
                    </a>
                  </div>
                </div>

                {day.totals && (
                  <div className="inventory-totals-strip">
                    <div>
                      <span>Opening</span>
                      <strong>{formatMoney(day.totals.openingCostMinor, currencyCode)}</strong>
                    </div>
                    <div>
                      <span>Waste</span>
                      <strong>{formatMoney(day.totals.wasteCostMinor, currencyCode)}</strong>
                    </div>
                    <div>
                      <span>Usage</span>
                      <strong>{formatMoney(day.totals.usageCostMinor, currencyCode)}</strong>
                    </div>
                    <div>
                      <span>Closing</span>
                      <strong>{formatMoney(day.totals.closingCostMinor, currencyCode)}</strong>
                    </div>
                    {day.totals.varianceCostMinor > 0 && (
                      <div className="inventory-variance">
                        <span>Variance</span>
                        <strong>
                          {formatMoney(day.totals.varianceCostMinor, currencyCode)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                <div className="waste-log-table-wrap">
                  <table className="waste-log-table inventory-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Opening</th>
                        <th>Waste</th>
                        <th>Closing</th>
                        <th>Usage</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reconciliation.map((line) => (
                        <tr key={line.id}>
                          <td>
                            <div className="waste-log-product">
                              <strong>{line.productName}</strong>
                              <small>{line.unit}</small>
                            </div>
                          </td>
                          <td>{line.openingQuantity}</td>
                          <td>
                            {line.wasteQuantity}
                            <small className="inventory-subvalue">
                              {formatMoney(line.wasteCostMinor, currencyCode)}
                            </small>
                          </td>
                          <td>{line.closingQuantity ?? "-"}</td>
                          <td>
                            {line.usageQuantity ?? "-"}
                            {line.varianceQuantity ? (
                              <small className="inventory-variance-tag">
                                +{line.varianceQuantity} unaccounted
                              </small>
                            ) : null}
                          </td>
                          <td>
                            <span className="waste-log-amount">
                              {line.usageCostMinor === null
                                ? "-"
                                : formatMoney(line.usageCostMinor, currencyCode)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {!isClosed && (
                  <button
                    className="button primary full inventory-close-btn"
                    onClick={() => onTabChange("closing")}
                    type="button"
                  >
                    Enter closing stock
                  </button>
                )}
              </section>

              {isClosed && (
                <StockHandoffNextDay
                  closedDay={day}
                  nextStockDate={nextStockDate}
                  onStartNextDay={onStartNextDay}
                />
              )}
            </>
          )}
        </div>
      )}

      {isToday && todayOpen && !isClosed && activeTab !== "waste" && (
        <p className="inventory-hint">
          Log waste in the{" "}
          <button
            className="link-button"
            onClick={() => onTabChange("waste")}
            type="button"
          >
            Waste tab
          </button>{" "}
          as it happens - it feeds closing reconciliation.
        </p>
      )}

      {message && (
        <div className={`app-toast import-toast ${messageTone}`}>{message}</div>
      )}
    </div>
  );
}

function getDailyStockFlowState({
  activeTab,
  dayStatus,
  hasProducts,
  wasteCount,
}: {
  activeTab: DailyStockTab;
  dayStatus: "open" | "closed" | null;
  hasProducts: boolean;
  wasteCount: number;
}): DailyStockFlowState {
  if (!hasProducts) {
    return {
      currentStep: "Setup",
      nextAction: "Add products before starting stock counts.",
      nextTab: null,
      progressLabel: "Menu needed",
      statusLabel: "Blocked",
    };
  }

  if (!dayStatus) {
    return {
      currentStep: "Step 1 of 4",
      nextAction: "Save opening stock to unlock waste and closing.",
      nextTab: activeTab === "opening" ? null : "opening",
      progressLabel: "Opening not saved",
      statusLabel: "Not started",
    };
  }

  if (dayStatus === "closed") {
    return {
      currentStep: "Step 4 of 4",
      nextAction: "Review the summary, export if needed, then start the next day.",
      nextTab: activeTab === "summary" ? null : "summary",
      progressLabel: "Ready for handoff",
      statusLabel: "Closed",
    };
  }

  if (activeTab === "opening") {
    return {
      currentStep: "Step 1 of 4",
      nextAction: "Opening is saved. Log waste as items leave the shelf.",
      nextTab: "waste",
      progressLabel: "Opening saved",
      statusLabel: "Open",
    };
  }

  if (activeTab === "waste") {
    return {
      currentStep: "Step 2 of 4",
      nextAction:
        wasteCount > 0
          ? "Waste is captured. Continue to closing when the day is ending."
          : "Log waste when it happens, or continue to closing if none was wasted.",
      nextTab: "closing",
      progressLabel: `${wasteCount} waste ${wasteCount === 1 ? "entry" : "entries"}`,
      statusLabel: "In progress",
    };
  }

  if (activeTab === "closing") {
    return {
      currentStep: "Step 3 of 4",
      nextAction: "Enter closing counts and close the day to lock reconciliation.",
      nextTab: null,
      progressLabel: "Closing counts needed",
      statusLabel: "In progress",
    };
  }

  return {
    currentStep: "Step 4 of 4",
    nextAction: "This is a live preview. Close the day when counts are final.",
    nextTab: "closing",
    progressLabel: "Preview",
    statusLabel: "Open",
  };
}

function DailyStockFlowGuide({
  currentStep,
  nextAction,
  onNext,
  progressLabel,
  statusLabel,
}: {
  currentStep: string;
  nextAction: string;
  onNext?: () => void;
  progressLabel: string;
  statusLabel: string;
}) {
  return (
    <section className="daily-stock-flow-guide">
      <div>
        <span>{currentStep}</span>
        <strong>{nextAction}</strong>
      </div>
      <div className="daily-stock-flow-guide-meta">
        <em>{statusLabel}</em>
        <small>{progressLabel}</small>
        {onNext ? (
          <button className="button ghost small" onClick={onNext} type="button">
            Go next
          </button>
        ) : null}
      </div>
    </section>
  );
}

function InventoryQuantityGrid({
  products,
  quantities,
  setQuantity,
  field,
  currencyCode,
  disabled,
}: {
  products: BusinessProduct[];
  quantities: Quantities;
  setQuantity: (productId: string, field: "opening" | "closing", value: number) => void;
  field: "opening" | "closing";
  currencyCode: string;
  disabled: boolean;
}) {
  return (
    <div className="inventory-qty-grid">
      {products.map((product) => (
        <article key={product.id}>
          <div>
            <strong>{product.name}</strong>
            <small>
              {formatMoney(product.unitCostMinor, currencyCode)} / {product.unit}
            </small>
          </div>
          <InventoryQuantityStepper
            ariaLabel={`${field} ${product.name}`}
            disabled={disabled}
            onChange={(value) => setQuantity(product.id, field, value)}
            unit={product.unit}
            value={quantities[product.id]?.[field] ?? 0}
          />
        </article>
      ))}
    </div>
  );
}
