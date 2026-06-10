"use client";

import { FormEvent, useState } from "react";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog, WasteReason } from "@/src/modules/waste/domain/waste";

export function WasteLogPanel({
  onSaved,
  products,
  reasons,
}: {
  currencyCode: string;
  onSaved: (log: WasteLog) => void;
  products: BusinessProduct[];
  reasons: WasteReason[];
}) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage("");

    const form = new FormData(formElement);
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

    onSaved(payload.log);
    formElement.reset();
    setSaving(false);
    setMessage("Waste entry saved.");
  }

  return (
    <section className="panel-app">
      <div className="panel-head-app">
        <div>
          <h2>Log one item</h2>
          <p>For ad-hoc waste during the day.</p>
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
      {message && <p className="quick-close-message">{message}</p>}
    </section>
  );
}
