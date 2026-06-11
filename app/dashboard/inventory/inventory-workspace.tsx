"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatMoney } from "@/src/lib/format-money";
import { localDateKey } from "@/src/lib/date/local-date-key";
import { invalidateInventoryCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type {
  InventoryDayDetail,
  InventoryDaySummary,
} from "@/src/modules/inventory/domain/inventory";

type Quantities = Record<string, { opening: number; closing: number }>;

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
      opening: line?.openingQuantity ?? 0,
      closing: line?.closingQuantity ?? 0,
    };
  }
  return map;
}

export function InventoryWorkspace({
  stockDate,
  currencyCode,
  products,
  day,
  recentDays,
  canCarryForward,
  todayOpen,
  onDateChange,
  onRefresh,
}: {
  stockDate: string;
  currencyCode: string;
  products: BusinessProduct[];
  day: InventoryDayDetail | null;
  recentDays: InventoryDaySummary[];
  canCarryForward: boolean;
  todayOpen: boolean;
  onDateChange: (date: string) => void;
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

  const reconciliation = useMemo(() => day?.lines ?? [], [day]);

  function setQuantity(
    productId: string,
    field: "opening" | "closing",
    value: number,
  ) {
    setQuantities((current) => ({
      ...current,
      [productId]: {
        opening: current[productId]?.opening ?? 0,
        closing: current[productId]?.closing ?? 0,
        [field]: Math.max(0, value),
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
    setMessage("Opening stock saved. Log waste during the day, then enter closing counts.");
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
    setMessage("Day closed. Export your reconciliation below.");
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
              <em>{item.status === "closed" ? "✓" : "…"}</em>
            </button>
          ))}
        </div>
      </div>

      {!day && (
        <section className="panel-app">
          <div className="panel-head-app">
            <div>
              <h2>Start opening stock</h2>
              <p>
                Enter what you have on hand at the start of {stockDate}. You can
                carry forward yesterday&apos;s closing counts.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="empty-state-app">
              <span className="empty-state-icon" aria-hidden>📦</span>
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
                {saving ? "Saving…" : "Save opening stock"}
              </button>
            </>
          )}
        </section>
      )}

      {day && (
        <>
          <section className="inventory-formula-banner">
            <strong>Reconciliation formula</strong>
            <p>
              <span>Usage (sold / consumed)</span> = Opening − Closing − Waste
              <br />
              Waste is pulled automatically from your{" "}
              <Link href="/dashboard/waste" prefetch>waste log</Link> for this date.
            </p>
          </section>

          {!isClosed && (
            <section className="panel-app">
              <div className="panel-head-app">
                <div>
                  <h2>Opening stock</h2>
                  <p>Adjust if counts changed after you opened the day.</p>
                </div>
                <span className={`status-pill ${day.status}`}>{day.status}</span>
              </div>
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
                {saving ? "Saving…" : "Update opening stock"}
              </button>
            </section>
          )}

          <section className="panel-app inventory-reconciliation-panel">
            <div className="panel-head-app">
              <div>
                <h2>Day reconciliation</h2>
                <p>
                  {isClosed
                    ? "Closed day — opening, waste, closing, and implied usage."
                    : "Enter closing counts below to complete the day."}
                </p>
              </div>
              {day && (
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
              )}
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
                    <strong>{formatMoney(day.totals.varianceCostMinor, currencyCode)}</strong>
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
                      <td>
                        {!isClosed ? (
                          <input
                            className="inventory-qty-input"
                            disabled={saving}
                            min="0"
                            onChange={(event) =>
                              setQuantity(
                                line.businessProductId,
                                "closing",
                                Number(event.target.value) || 0,
                              )
                            }
                            step="0.001"
                            type="number"
                            value={quantities[line.businessProductId]?.closing ?? 0}
                          />
                        ) : (
                          line.closingQuantity
                        )}
                      </td>
                      <td>
                        {line.usageQuantity ?? "—"}
                        {line.varianceQuantity ? (
                          <small className="inventory-variance-tag">
                            +{line.varianceQuantity} unaccounted
                          </small>
                        ) : null}
                      </td>
                      <td>
                        <span className="waste-log-amount">
                          {line.usageCostMinor === null
                            ? "—"
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
                disabled={saving}
                onClick={closeDay}
                type="button"
              >
                {saving ? "Closing…" : "Close day with closing stock"}
              </button>
            )}
          </section>

          {isToday && todayOpen && !isClosed && (
            <p className="inventory-hint">
              Remember to log waste in{" "}
              <Link href="/dashboard/waste" prefetch>
                Waste log
              </Link>{" "}
              before closing — those quantities feed this reconciliation.
            </p>
          )}
        </>
      )}

      {message && (
        <div className={`app-toast import-toast ${messageTone}`}>{message}</div>
      )}
    </div>
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
          <input
            className="inventory-qty-input"
            disabled={disabled}
            min="0"
            onChange={(event) =>
              setQuantity(product.id, field, Number(event.target.value) || 0)
            }
            step="0.001"
            type="number"
            value={quantities[product.id]?.[field] ?? 0}
          />
        </article>
      ))}
    </div>
  );
}
