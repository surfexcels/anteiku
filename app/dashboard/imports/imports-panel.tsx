"use client";

import { type DragEvent, FormEvent, useCallback, useRef, useState } from "react";
import { formatImportSourceLabel } from "@/src/lib/imports/import-display";
import { DashboardIcon, EmptyStateVisual } from "../dashboard-icons";
import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";

const ACCEPTED_TYPES = ".pdf,.csv,.xlsx";
const ACCEPTED_LABELS = ["PDF", "CSV", "Excel"];

function fileKind(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "csv") return "csv";
  if (ext === "xlsx" || ext === "xls") return "xlsx";
  return "file";
}

function FileTypeIcon({ kind }: { kind: string }) {
  const label =
    kind === "pdf" ? "PDF" : kind === "csv" ? "CSV" : kind === "xlsx" ? "XLS" : "DOC";
  return <span className={`import-file-icon ${kind}`}>{label}</span>;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImportsPanel({
  initialImports,
}: {
  initialImports: SupplierImport[];
}) {
  const [imports, setImports] = useState(initialImports);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = useCallback((file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !["pdf", "csv", "xlsx", "xls"].includes(ext)) {
      setMessage("Use a PDF, CSV, or Excel (.xlsx) invoice.");
      setMessageTone("error");
      return;
    }
    setSelectedFile(file);
    setMessage("");
  }, []);

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files[0];
    if (file) pickFile(file);
  }

  async function registerImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    if (!selectedFile) {
      setMessage("Choose an invoice file to upload.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    const uploadData = new FormData();
    uploadData.append("file", selectedFile);

    const response = await fetch("/api/supplier-imports", {
      method: "POST",
      body: uploadData,
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not register import.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    setImports((current) => [payload.import, ...current]);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
    setSaving(false);
    setMessageTone("success");
    setMessage(payload.import?.result?.message ?? "Import uploaded and processed.");
  }

  const completedCount = imports.filter((i) => i.status === "completed").length;
  const matchedTotal = imports.reduce(
    (sum, item) => sum + (item.result?.matchedCount ?? 0),
    0,
  );

  return (
    <div className="imports-workspace">
      <div className="imports-upload-grid">
        <section className="panel-app import-upload-panel">
          <div className="panel-head-app">
            <div>
              <h2>Register supplier invoice</h2>
              <p>
                Drop a supplier file — we read line items and match them to your menu.
              </p>
            </div>
          </div>

          <form className="import-upload-form" onSubmit={registerImport}>
            <div
              className={[
                "import-dropzone",
                dragOver ? "drag-over" : "",
                selectedFile ? "has-file" : "",
                saving ? "is-saving" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setDragOver(false);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              onClick={() => !saving && inputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  inputRef.current?.click();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <input
                accept={ACCEPTED_TYPES}
                className="import-file-input"
                disabled={saving}
                name="file"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                ref={inputRef}
                type="file"
              />

              {selectedFile ? (
                <div className="import-dropzone-file">
                  <FileTypeIcon kind={fileKind(selectedFile.name)} />
                  <div>
                    <strong>{selectedFile.name}</strong>
                    <small>{formatFileSize(selectedFile.size)}</small>
                  </div>
                  <button
                    className="import-clear-file"
                    disabled={saving}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <span className="import-dropzone-icon" aria-hidden>
                    <DashboardIcon name="upload" size={22} />
                  </span>
                  <strong>Drag invoice here or click to browse</strong>
                  <small>PDF, CSV, or Excel up to your storage limit</small>
                </>
              )}

              {saving && (
                <div className="import-upload-progress" aria-live="polite">
                  <span className="import-progress-bar" />
                  <small>Extracting lines and matching menu…</small>
                </div>
              )}
            </div>

            <div className="import-format-chips">
              {ACCEPTED_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <button
              className="button primary full import-submit"
              disabled={saving || !selectedFile}
              type="submit"
            >
              {saving ? "Processing…" : "Upload and process"}
            </button>
          </form>
        </section>

        <aside className="panel-app import-guide-panel">
          <span className="import-guide-label">How it works</span>
          <ol className="import-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Upload invoice</strong>
                <p>PDF scan, CSV export, or Excel from your supplier.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Read the invoice</strong>
                <p>Product names, quantities, and costs are pulled from the file.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Menu matching</strong>
                <p>Lines are matched to your menu, including similar product names.</p>
              </div>
            </li>
          </ol>
          <div className="import-guide-stats">
            <div>
              <strong>{imports.length}</strong>
              <span>uploads</span>
            </div>
            <div>
              <strong>{completedCount}</strong>
              <span>completed</span>
            </div>
            <div>
              <strong>{matchedTotal}</strong>
              <span>lines matched</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="panel-app import-history-panel">
        <div className="panel-head-app">
          <div>
            <h2>Import history</h2>
            <p>Tracked supplier uploads for your business</p>
          </div>
          {imports.length > 0 && <span>{imports.length}</span>}
        </div>

        {imports.length === 0 ? (
          <div className="empty-state-app import-empty">
            <EmptyStateVisual icon="imports" />
            <strong>No imports yet</strong>
            <p>
              Upload your first supplier invoice above. Matched lines will update product
              costs automatically.
            </p>
          </div>
        ) : (
          <div className="import-history-list">
            {imports.map((item) => {
              const kind = fileKind(item.originalFilename);
              const lineCount = item.result?.lineCount ?? 0;
              const matched = item.result?.matchedCount ?? 0;
              const matchRate =
                lineCount > 0 ? Math.round((matched / lineCount) * 100) : null;

              return (
                <article className="import-history-card" key={item.id}>
                  <div className="import-history-head">
                    <FileTypeIcon kind={kind} />
                    <div className="import-history-title">
                      <strong>{item.originalFilename}</strong>
                      <small>{new Date(item.createdAt).toLocaleString()}</small>
                    </div>
                    <span className={`status-pill ${item.status}`}>{item.status}</span>
                  </div>

                  {(lineCount > 0 || item.result?.message) && (
                    <div className="import-history-meta">
                      {lineCount > 0 && (
                        <>
                          <span>{lineCount} lines</span>
                          <span>{matched} matched</span>
                          {matchRate !== null && (
                            <span className={matchRate >= 70 ? "metric-good" : "metric-bad"}>
                              {matchRate}% match rate
                            </span>
                          )}
                        </>
                      )}
                      {item.result?.ocrMethod && (
                        <span className="import-method-tag">
                          {formatImportSourceLabel(item.result.ocrMethod)}
                        </span>
                      )}
                      {item.result?.aiUsed && (
                        <span className="import-method-tag ai">Smart match</span>
                      )}
                    </div>
                  )}

                  {item.result?.message && (
                    <p className="import-summary">{item.result.message}</p>
                  )}

                  {item.errorMessage && (
                    <p className="import-error">{item.errorMessage}</p>
                  )}

                  {item.result?.lineItems && item.result.lineItems.length > 0 && (
                    <ul className="import-lines">
                      {item.result.lineItems.slice(0, 5).map((line) => (
                        <li key={`${item.id}-${line.description}`}>
                          <span>{line.description}</span>
                          {line.matchedProductName ? (
                            <b>→ {line.matchedProductName}</b>
                          ) : (
                            <i>No menu match</i>
                          )}
                        </li>
                      ))}
                      {item.result.lineItems.length > 5 && (
                        <li className="import-lines-more">
                          +{item.result.lineItems.length - 5} more lines
                        </li>
                      )}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {message && (
        <div className={`app-toast import-toast ${messageTone}`}>{message}</div>
      )}
    </div>
  );
}
