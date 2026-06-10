"use client";

import { FormEvent, useState } from "react";
import { formatMoney } from "@/src/lib/format-money";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";

export function WasteLogPanel({
  currencyCode,
  initialLogs,
  products,
  reasons,
}: {
  currencyCode: string;
  initialLogs: WasteLog[];
  products: BusinessProduct[];
  reasons: WasteReason[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/waste-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessProductId: form.get("businessProductId"),
        wasteReasonId: form.get("wasteReasonId") || undefined,
        quantity: form.get("quantity"),
        note: form.get("note") || undefined,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not save waste log.");
      setSaving(false);
      return;
    }

    setLogs((current) => [payload.log, ...current]);
    event.currentTarget.reset();
    setSaving(false);
    setMessage("Waste entry saved.");
  }

  return (
    <div className="feature-workspace">
      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Log waste</h2>
            <p>Choose a menu item, quantity, and reason.</p>
          </div>
        </div>
        {products.length === 0 ? (
          <div className="empty-state-app">
            <strong>Add menu items first</strong>
            <p>You need products with unit costs before logging waste.</p>
          </div>
        ) : (
          <form className="stack-form" onSubmit={submitLog}>
            <label>
              Product
              <select name="businessProductId" required>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-fields">
              <label>
                Quantity
                <input
                  min="0.001"
                  name="quantity"
                  required
                  step="0.001"
                  type="number"
                />
              </label>
              <label>
                Reason
                <select name="wasteReasonId">
                  <option value="">Optional</option>
                  {reasons.map((reason) => (
                    <option key={reason.id} value={reason.id}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Note
              <input maxLength={500} name="note" placeholder="Optional note" />
            </label>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save waste entry"}
            </button>
          </form>
        )}
      </section>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Recent entries</h2>
            <p>Latest waste logs for your business</p>
          </div>
          <span>{logs.length}</span>
        </div>
        <div className="data-list">
          {logs.map((log) => (
            <article className="data-row" key={log.id}>
              <div>
                <strong>{log.productName}</strong>
                <span>
                  {log.quantity} units
                  {log.wasteReasonLabel ? ` · ${log.wasteReasonLabel}` : ""}
                </span>
              </div>
              <div className="data-row-meta">
                <small>{new Date(log.occurredAt).toLocaleString()}</small>
                <b>{formatMoney(log.totalCostMinor, log.currencyCode)}</b>
              </div>
            </article>
          ))}
          {logs.length === 0 && (
            <div className="empty-state-app">
              <strong>No entries yet</strong>
              <p>Your waste history will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {message && <div className="app-toast">{message}</div>}
    </div>
  );
}
