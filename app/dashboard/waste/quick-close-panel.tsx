"use client";

import { useMemo, useState } from "react";
import { EmptyStateVisual } from "../dashboard-icons";
import { formatMoney } from "@/src/lib/format-money";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";

export function QuickClosePanel({
  currencyCode,
  onSaved,
  products,
  reasons,
}: {
  currencyCode: string;
  onSaved: (logs: WasteLog[]) => void;
  products: BusinessProduct[];
  reasons: WasteReason[];
}) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [wasteReasonId, setWasteReasonId] = useState(
    () => reasons.find((reason) => reason.code === "unsold")?.id ?? "",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const entries = useMemo(
    () =>
      Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([businessProductId, quantity]) => ({
          businessProductId,
          quantity,
        })),
    [quantities],
  );

  const estimatedTotalMinor = useMemo(() => {
    return entries.reduce((sum, entry) => {
      const product = products.find((item) => item.id === entry.businessProductId);
      if (!product) return sum;
      return sum + Math.round(entry.quantity * product.unitCostMinor);
    }, 0);
  }, [entries, products]);

  function setQuantity(productId: string, next: number) {
    const value = Math.max(0, next);
    setQuantities((current) => {
      if (value === 0) {
        const { [productId]: _, ...rest } = current;
        return rest;
      }
      return { ...current, [productId]: value };
    });
  }

  function adjustQuantity(productId: string, delta: number) {
    setQuantity(productId, (quantities[productId] ?? 0) + delta);
  }

  async function submitClose() {
    if (entries.length === 0) {
      setMessage("Tap + on at least one product before saving.");
      return;
    }

    setSaving(true);
    setMessage("");

    const response = await fetch("/api/waste-logs/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        wasteReasonId: wasteReasonId || undefined,
        entries,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not save close-out.");
      setSaving(false);
      return;
    }

    onSaved(payload.logs);
    setQuantities({});
    setSaving(false);
    setMessage(
      `Close-out saved: ${payload.summary.count} items · ${formatMoney(payload.summary.totalCostMinor, currencyCode)}`,
    );
  }

  if (products.length === 0) {
    return (
      <section className="panel-app">
        <div className="empty-state-app">
          <EmptyStateVisual icon="products" />
          <strong>Add menu items first</strong>
          <p>Quick close works from the products you set up with unit costs.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="panel-app quick-close-panel">
      <div className="panel-head-app">
        <div>
          <h2>End-of-day quick close</h2>
          <p>Tap + or the product card. Your counts stay when you switch tabs.</p>
        </div>
        <span className="quick-close-total">
          {formatMoney(estimatedTotalMinor, currencyCode)}
        </span>
      </div>

      <label className="quick-close-reason">
        Default reason for this close-out
        <select
          onChange={(event) => setWasteReasonId(event.target.value)}
          value={wasteReasonId}
        >
          <option value="">Optional</option>
          {reasons.map((reason) => (
            <option key={reason.id} value={reason.id}>
              {reason.label}
            </option>
          ))}
        </select>
      </label>

      <div className="quick-close-grid">
        {products.map((product) => {
          const quantity = quantities[product.id] ?? 0;
          return (
            <article
              className={quantity > 0 ? "active" : undefined}
              key={product.id}
              onClick={() => adjustQuantity(product.id, 1)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  adjustQuantity(product.id, 1);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <div>
                <strong>{product.name}</strong>
                <small>{formatMoney(product.unitCostMinor, product.currencyCode)} each</small>
              </div>
              <div
                className="qty-stepper"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <button
                  aria-label={`Decrease ${product.name}`}
                  onClick={() => adjustQuantity(product.id, -1)}
                  type="button"
                >
                  -
                </button>
                <input
                  aria-label={`Quantity for ${product.name}`}
                  inputMode="decimal"
                  min="0"
                  onChange={(event) =>
                    setQuantity(product.id, Number(event.target.value) || 0)
                  }
                  step="0.001"
                  type="number"
                  value={quantity}
                />
                <button
                  aria-label={`Increase ${product.name}`}
                  onClick={() => adjustQuantity(product.id, 1)}
                  type="button"
                >
                  +
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="quick-close-footer">
        <button
          className="button primary full"
          disabled={saving || entries.length === 0}
          onClick={submitClose}
          type="button"
        >
          {saving
            ? "Saving..."
            : `Save close-out (${entries.length} item${entries.length === 1 ? "" : "s"}) · ${formatMoney(estimatedTotalMinor, currencyCode)}`}
        </button>
        {message && <p className="quick-close-message">{message}</p>}
      </div>
    </section>
  );
}
