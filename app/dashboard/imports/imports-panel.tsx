"use client";

import { FormEvent, useState } from "react";
import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";

export function ImportsPanel({
  initialImports,
}: {
  initialImports: SupplierImport[];
}) {
  const [imports, setImports] = useState(initialImports);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function registerImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    const filename =
      file instanceof File && file.name ? file.name : "supplier-invoice.pdf";

    const response = await fetch("/api/supplier-imports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originalFilename: filename }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not register import.");
      setSaving(false);
      return;
    }

    setImports((current) => [payload.import, ...current]);
    event.currentTarget.reset();
    setSaving(false);
    setMessage("Import queued for processing.");
  }

  return (
    <div className="feature-workspace">
      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Register supplier invoice</h2>
            <p>
              Select an invoice file to queue matching. File parsing runs in a
              later processing step.
            </p>
          </div>
        </div>
        <form className="stack-form" onSubmit={registerImport}>
          <label>
            Invoice file
            <input accept=".pdf,.csv,.xlsx" name="file" type="file" />
          </label>
          <button className="button primary" disabled={saving} type="submit">
            {saving ? "Registering..." : "Queue import"}
          </button>
        </form>
      </section>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Import history</h2>
            <p>Tracked supplier uploads for your business</p>
          </div>
        </div>
        <div className="data-list">
          {imports.map((item) => (
            <article className="data-row" key={item.id}>
              <div>
                <strong>{item.originalFilename}</strong>
                <span className={`status-pill ${item.status}`}>
                  {item.status}
                </span>
              </div>
              <small>{new Date(item.createdAt).toLocaleString()}</small>
            </article>
          ))}
          {imports.length === 0 && (
            <div className="empty-state-app">
              <strong>No imports yet</strong>
              <p>Supplier invoice ingestion will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {message && <div className="app-toast">{message}</div>}
    </div>
  );
}
