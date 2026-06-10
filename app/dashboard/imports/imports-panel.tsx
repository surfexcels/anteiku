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
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage("");

    const form = new FormData(formElement);
    const file = form.get("file");

    if (!(file instanceof File) || !file.name) {
      setMessage("Choose an invoice file to upload.");
      setSaving(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/supplier-imports", {
      method: "POST",
      body: uploadData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not register import.");
      setSaving(false);
      return;
    }

    setImports((current) => [payload.import, ...current]);
    formElement.reset();
    setSaving(false);
    setMessage(payload.import?.result?.message ?? "Import uploaded.");
  }

  return (
    <div className="feature-workspace">
      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Register supplier invoice</h2>
            <p>
              Upload a PDF, CSV, or Excel invoice. The Python OCR service extracts
              line items; optional OpenAI improves menu matching.
            </p>
          </div>
        </div>
        <form className="stack-form" onSubmit={registerImport}>
          <label>
            Invoice file
            <input accept=".pdf,.csv,.xlsx" name="file" type="file" />
          </label>
          <button className="button primary" disabled={saving} type="submit">
            {saving ? "Processing..." : "Upload and process"}
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
            <article className="data-row stacked import-row" key={item.id}>
              <div className="import-row-head">
                <div>
                  <strong>{item.originalFilename}</strong>
                  <span className={`status-pill ${item.status}`}>
                    {item.status}
                  </span>
                </div>
                <small>{new Date(item.createdAt).toLocaleString()}</small>
              </div>
              {item.result?.message && (
                <p className="import-summary">
                  {item.result.ocrMethod ? `${item.result.ocrMethod} · ` : ""}
                  {item.result.message}
                </p>
              )}
              {item.result?.lineItems && item.result.lineItems.length > 0 && (
                <ul className="import-lines">
                  {item.result.lineItems.slice(0, 5).map((line) => (
                    <li key={`${item.id}-${line.description}`}>
                      <span>{line.description}</span>
                      {line.matchedProductName ? (
                        <b>Matched: {line.matchedProductName}</b>
                      ) : (
                        <i>No menu match</i>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
