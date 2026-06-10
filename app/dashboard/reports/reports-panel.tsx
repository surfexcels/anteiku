"use client";

import { FormEvent, useState } from "react";
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

export function ReportsPanel({
  currencyCode,
  initialReports,
}: {
  currencyCode: string;
  initialReports: Report[];
}) {
  const defaults = defaultDates();
  const [reports, setReports] = useState(initialReports);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function createReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        periodStart: form.get("periodStart"),
        periodEnd: form.get("periodEnd"),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setMessage(payload.error || "Could not create report.");
      setSaving(false);
      return;
    }

    setReports((current) => [payload.report, ...current]);
    setSaving(false);
    setMessage("Report created.");
  }

  return (
    <div className="feature-workspace">
      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Create report</h2>
            <p>Summarise waste cost for any date range.</p>
          </div>
        </div>
        <form className="stack-form" onSubmit={createReport}>
          <div className="inline-fields">
            <label>
              From
              <input
                defaultValue={defaults.start}
                name="periodStart"
                required
                type="date"
              />
            </label>
            <label>
              To
              <input
                defaultValue={defaults.end}
                name="periodEnd"
                required
                type="date"
              />
            </label>
          </div>
          <button className="button primary" disabled={saving} type="submit">
            {saving ? "Creating..." : "Generate report"}
          </button>
        </form>
      </section>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Saved reports</h2>
            <p>Historical summaries for your business</p>
          </div>
        </div>
        <div className="data-list">
          {reports.map((report) => (
            <article className="data-row stacked" key={report.id}>
              <div>
                <strong>
                  {report.periodStart} to {report.periodEnd}
                </strong>
                <span>
                  {report.summary.logCount} entries ·{" "}
                  {formatMoney(report.summary.totalCostMinor, currencyCode)}
                </span>
              </div>
              {report.summary.topProducts.length > 0 && (
                <small>
                  Top: {report.summary.topProducts[0].productName}
                </small>
              )}
            </article>
          ))}
          {reports.length === 0 && (
            <div className="empty-state-app">
              <strong>No reports yet</strong>
              <p>Generate your first weekly summary above.</p>
            </div>
          )}
        </div>
      </section>

      {message && <div className="app-toast">{message}</div>}
    </div>
  );
}
