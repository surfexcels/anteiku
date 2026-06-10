"use client";

import { FormEvent, useState } from "react";
import type { BusinessProduct } from "@/src/modules/catalog/domain/catalog-product";
import type { WasteLog } from "@/src/modules/waste/domain/waste";

interface ImportPreview {
  rows: Array<{ rowNumber: number; productName: string; quantity: number }>;
  matched: Array<{
    rowNumber: number;
    productName: string;
    quantity: number;
    businessProductId: string;
  }>;
  unmatched: Array<{ rowNumber: number; productName: string; quantity: number }>;
}

export function SpreadsheetImportPanel({
  onSaved,
  products,
}: {
  onSaved: (logs: WasteLog[]) => void;
  products: BusinessProduct[];
}) {
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setPreview(null);

    const form = new FormData(event.currentTarget);
    const file = form.get("file");
    if (!(file instanceof File)) {
      setMessage("Choose a CSV export from Excel or Google Sheets.");
      setSaving(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", file);
    uploadData.append("preview", "true");

    const response = await fetch("/api/waste-logs/import", {
      method: "POST",
      body: uploadData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not read spreadsheet.");
      setSaving(false);
      return;
    }

    setPreview(payload.preview);
    setSaving(false);
  }

  async function confirmImport() {
    const input = document.querySelector<HTMLInputElement>(
      "#waste-spreadsheet-file",
    );
    const file = input?.files?.[0];
    if (!file) return;

    setSaving(true);
    setMessage("");

    const uploadData = new FormData();
    uploadData.append("file", file);

    const response = await fetch("/api/waste-logs/import", {
      method: "POST",
      body: uploadData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not import spreadsheet.");
      setSaving(false);
      return;
    }

    onSaved(payload.logs);
    setPreview(null);
    if (input) input.value = "";
    setSaving(false);
    setMessage(
      `Imported ${payload.importedCount} rows. Skipped ${payload.skippedCount} unmatched rows.`,
    );
  }

  return (
    <section className="panel-app">
      <div className="panel-head-app">
        <div>
          <h2>Import from Excel or Google Sheets</h2>
          <p>
            Export your sheet as CSV. Columns: date, product, quantity, reason (flexible
            headers).
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state-app">
          <strong>Set up your menu first</strong>
          <p>Import matches rows to product names on your menu.</p>
        </div>
      ) : (
        <>
          <form className="stack-form" onSubmit={handleFile}>
            <label>
              Spreadsheet file (.csv)
              <input
                accept=".csv,text/csv"
                id="waste-spreadsheet-file"
                name="file"
                required
                type="file"
              />
            </label>
            <button className="button primary" disabled={saving} type="submit">
              {saving ? "Reading..." : "Preview import"}
            </button>
          </form>

          {preview && (
            <div className="import-preview-box">
              <strong>
                {preview.rows.length === 0
                  ? "No data rows found in this CSV"
                  : `${preview.matched.length} matched · ${preview.unmatched.length} unmatched`}
              </strong>
              {preview.rows.length === 0 && (
                <p>
                  Use a CSV with Product and Quantity columns, or re-export from
                  Anteiku (Export CSV on the Waste log page).
                </p>
              )}
              {preview.unmatched.length > 0 && (
                <p>
                  Unmatched:{" "}
                  {preview.unmatched
                    .slice(0, 4)
                    .map((row) => row.productName)
                    .join(", ")}
                  {preview.unmatched.length > 4 ? "…" : ""}
                </p>
              )}
              <button
                className="button primary"
                disabled={saving || preview.matched.length === 0}
                onClick={confirmImport}
                type="button"
              >
                {saving ? "Importing..." : "Import matched rows"}
              </button>
            </div>
          )}
        </>
      )}

      {message && <p className="quick-close-message">{message}</p>}
    </section>
  );
}
