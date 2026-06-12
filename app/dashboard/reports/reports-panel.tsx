"use client";

import { FormEvent, useMemo, useState } from "react";
import { EmptyStateVisual } from "../dashboard-icons";
import { formatMoney } from "@/src/lib/format-money";
import type { Report } from "@/src/modules/reports/domain/report";

function defaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function presetRange(days: number) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function presetThisMonth() {
  const end = new Date();
  const start = new Date(end.getFullYear(), end.getMonth(), 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function formatPeriod(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const sameYear = s.getFullYear() === e.getFullYear();
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = s.toLocaleDateString(undefined, opts);
  const endStr = e.toLocaleDateString(
    undefined,
    sameYear ? opts : { ...opts, year: "numeric" },
  );
  return `${startStr} – ${endStr}${sameYear ? `, ${s.getFullYear()}` : ""}`;
}

function daysInRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

export function ReportsPanel({
  currencyCode,
  initialReports,
}: {
  currencyCode: string;
  initialReports: Report[];
}) {
  const defaults = defaultDates();
  const [reports, setReports] = useState(initialReports);
  const [periodStart, setPeriodStart] = useState(defaults.start);
  const [periodEnd, setPeriodEnd] = useState(defaults.end);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  const totalWasteMinor = useMemo(
    () => reports.reduce((sum, r) => sum + r.summary.totalCostMinor, 0),
    [reports],
  );

  async function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ periodStart, periodEnd }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not create report.");
      setMessageTone("error");
      setSaving(false);
      return;
    }

    setReports((current) => [payload.report, ...current]);
    setSaving(false);
    setMessageTone("success");
    setMessage("Report created.");
  }

  function applyPreset(range: { start: string; end: string }) {
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  return (
    <div className="reports-workspace">
      <div className="reports-main-grid">
        <section className="panel-app report-create-panel">
          <div className="panel-head-app">
            <div>
              <h2>Create report</h2>
              <p>Summarise waste cost for any date range.</p>
            </div>
          </div>

          <form className="report-create-form" onSubmit={createReport}>
            <div className="report-presets">
              <span>Quick range</span>
              <div className="report-preset-buttons">
                <button
                  onClick={() => applyPreset(presetRange(7))}
                  type="button"
                >
                  Last 7 days
                </button>
                <button
                  onClick={() => applyPreset(presetRange(30))}
                  type="button"
                >
                  Last 30 days
                </button>
                <button onClick={() => applyPreset(presetThisMonth())} type="button">
                  This month
                </button>
              </div>
            </div>

            <div className="report-date-fields">
              <label>
                From
                <input
                  name="periodStart"
                  onChange={(e) => setPeriodStart(e.target.value)}
                  required
                  type="date"
                  value={periodStart}
                />
              </label>
              <label>
                To
                <input
                  name="periodEnd"
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  required
                  type="date"
                  value={periodEnd}
                />
              </label>
            </div>

            <div className="report-range-preview">
              <span>{daysInRange(periodStart, periodEnd)} days selected</span>
              <span>{formatPeriod(periodStart, periodEnd)}</span>
            </div>

            <button
              className="button primary full report-submit"
              disabled={saving}
              type="submit"
            >
              {saving ? "Creating…" : "Generate report"}
            </button>
          </form>
        </section>

        <aside className="panel-app report-guide-panel">
          <span className="import-guide-label">What you get</span>
          <ol className="import-steps">
            <li>
              <span>1</span>
              <div>
                <strong>Period totals</strong>
                <p>Total waste cost and entry count for the range.</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Top products</strong>
                <p>See which menu items drove the most loss.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>CSV export</strong>
                <p>Download for accounting, audits, or team reviews.</p>
              </div>
            </li>
          </ol>
          <div className="import-guide-stats">
            <div>
              <strong>{reports.length}</strong>
              <span>reports</span>
            </div>
            <div>
              <strong>{formatMoney(totalWasteMinor, currencyCode)}</strong>
              <span>total logged</span>
            </div>
          </div>
        </aside>
      </div>

      <section className="panel-app report-history-panel">
        <div className="panel-head-app">
          <div>
            <h2>Saved reports</h2>
            <p>Historical summaries for your business</p>
          </div>
          {reports.length > 0 && <span>{reports.length}</span>}
        </div>

        {reports.length === 0 ? (
          <div className="empty-state-app report-empty">
            <EmptyStateVisual icon="reports" />
            <strong>No reports yet</strong>
            <p>Pick a date range above and generate your first weekly summary.</p>
          </div>
        ) : (
          <div className="report-history-list">
            {reports.map((report) => {
              const top = report.summary.topProducts[0];
              const topShare =
                top && report.summary.totalCostMinor > 0
                  ? Math.round(
                      (top.totalCostMinor / report.summary.totalCostMinor) * 100,
                    )
                  : 0;

              return (
                <article className="report-history-card" key={report.id}>
                  <div className="report-history-head">
                    <div className="report-period-badge">
                      <span>{daysInRange(report.periodStart, report.periodEnd)}d</span>
                    </div>
                    <div className="report-history-title">
                      <strong>{formatPeriod(report.periodStart, report.periodEnd)}</strong>
                      <small>
                        Created {new Date(report.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                    <a
                      className="button ghost small report-export-btn"
                      download
                      href={`/api/reports/${report.id}/export`}
                    >
                      Export CSV
                    </a>
                  </div>

                  <div className="report-history-stats">
                    <div>
                      <span>Total waste</span>
                      <strong>
                        {formatMoney(report.summary.totalCostMinor, currencyCode)}
                      </strong>
                    </div>
                    <div>
                      <span>Entries</span>
                      <strong>{report.summary.logCount}</strong>
                    </div>
                    {top && (
                      <div>
                        <span>Top product</span>
                        <strong>{top.productName}</strong>
                      </div>
                    )}
                  </div>

                  {top && (
                    <div className="report-top-bar">
                      <div className="report-top-bar-head">
                        <small>{top.productName}</small>
                        <small>{topShare}% of period</small>
                      </div>
                      <div className="rank-bar-track">
                        <div className="rank-bar-fill" style={{ width: `${topShare}%` }} />
                      </div>
                    </div>
                  )}

                  {report.summary.topProducts.length > 1 && (
                    <ul className="report-top-list">
                      {report.summary.topProducts.slice(1, 4).map((product) => (
                        <li key={product.productName}>
                          <span>{product.productName}</span>
                          <b>{formatMoney(product.totalCostMinor, currencyCode)}</b>
                        </li>
                      ))}
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
