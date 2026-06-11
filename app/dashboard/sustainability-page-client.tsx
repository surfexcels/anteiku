"use client";

import Link from "next/link";
import { useState } from "react";
import {
  sustainabilityBootstrapUrl,
  sustainabilityCacheKey,
} from "@/src/lib/client/dashboard-cache-keys";
import { invalidateProductCaches } from "@/src/lib/client/invalidate-dashboard-caches";
import { useDashboardBootstrap } from "@/src/lib/client/use-dashboard-bootstrap";
import { formatCo2e } from "@/src/modules/sustainability/application/carbon-equivalencies";
import type {
  CarbonOverviewAnalytics,
  EmpCoReadiness,
} from "@/src/modules/sustainability/domain/carbon";
import { ChecklistMarker } from "./dashboard-icons";
import { CalculationExplainer } from "./calculation-explainer";
import { CarbonCalculationCopy } from "./carbon-calculation-copy";
import { PageSkeleton } from "./page-skeleton";

interface SustainabilityBootstrap {
  businessName: string;
  countryCode: string;
  periodDays: number;
  carbon: CarbonOverviewAnalytics;
  equivalencies: { carKm: number; smartphoneCharges: number };
  empco: EmpCoReadiness;
  products: Array<{
    id: string;
    name: string;
    unit: string;
    unitCo2eG: number | null;
    co2eSource: string;
    isActive: boolean;
  }>;
}

export function SustainabilityPageClient() {
  const [periodDays, setPeriodDays] = useState(7);
  const [disclosureSaving, setDisclosureSaving] = useState(false);
  const [disclosureEnabled, setDisclosureEnabled] = useState<boolean | null>(null);

  const { data, error, isLoading } = useDashboardBootstrap<SustainabilityBootstrap>(
    sustainabilityCacheKey(periodDays),
    sustainabilityBootstrapUrl(periodDays),
  );

  const enabled = disclosureEnabled ?? data?.empco.disclosureEnabled ?? true;

  async function toggleDisclosure() {
    setDisclosureSaving(true);
    const next = !enabled;
    const response = await fetch("/api/dashboard/sustainability", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ carbonDisclosureEnabled: next }),
    });
    if (response.ok) {
      setDisclosureEnabled(next);
      invalidateProductCaches();
    }
    setDisclosureSaving(false);
  }

  if (error) {
    return (
      <main className="dashboard-overview">
        <div className="empty-state-app">
          <strong>{error}</strong>
        </div>
      </main>
    );
  }

  if (isLoading || !data) {
    return (
      <main className="dashboard-overview">
        <PageSkeleton tall />
      </main>
    );
  }

  const carbonTrend = data.carbon.trend.map((day) => ({
    date: day.date,
    totalCostMinor: 0,
    itemCount: day.itemCount,
    totalCo2eG: day.totalCo2eG,
  }));

  return (
    <main className="dashboard-overview">
      <header className="app-page-header">
        <div>
          <span className="app-kicker">Sustainability</span>
          <h1>Carbon & EmpCo readiness</h1>
          <p>
            Track CO₂e from food waste at {data.businessName} and prepare for EU
            green-claims rules (in force 27 Sep 2026).
          </p>
        </div>
        <div className="overview-header-actions">
          <div className="period-toggle" role="group" aria-label="Reporting period">
            <button
              className={periodDays === 7 ? "active" : undefined}
              onClick={() => setPeriodDays(7)}
              type="button"
            >
              7 days
            </button>
            <button
              className={periodDays === 30 ? "active" : undefined}
              onClick={() => setPeriodDays(30)}
              type="button"
            >
              30 days
            </button>
          </div>
        </div>
      </header>

      <section className="panel-app empco-banner">
        <div>
          <strong>EU Empowering Consumers Directive (EmpCo)</strong>
          <p>
            Applies from <b>{data.empco.appliesFrom}</b>. Member states transpose by{" "}
            {data.empco.transpositionDeadline}. Vague claims like &quot;eco-friendly&quot;
            require verified proof — carbon labels must name the methodology.
          </p>
        </div>
        <button
          className={`button small ${enabled ? "primary" : "ghost"}`}
          disabled={disclosureSaving}
          onClick={toggleDisclosure}
          type="button"
        >
          {disclosureSaving
            ? "Saving..."
            : enabled
              ? "Public disclosure on"
              : "Public disclosure off"}
        </button>
      </section>

      <section className="metric-grid-app metric-grid-overview">
        <article className="metric-card-app featured">
          <span>Waste CO₂e ({periodDays}d)</span>
          <strong>{formatCo2e(data.carbon.summary.totalCo2eG)}</strong>
          <p>{data.equivalencies.carKm} km driving equivalent</p>
        </article>
        <article className="metric-card-app">
          <span>Menu factors set</span>
          <strong>{data.empco.productsWithFactors}</strong>
          <p>{data.empco.productsMissingFactors} still on defaults</p>
        </article>
        <article className="metric-card-app">
          <span>Verified factors</span>
          <strong>{data.empco.productsVerified}</strong>
          <p>Required for public carbon labels</p>
        </article>
        <article className="metric-card-app">
          <span>EmpCo claim-ready</span>
          <strong>{data.empco.canMakePublicClaims ? "Yes" : "Not yet"}</strong>
          <p>
            <Link href="/dashboard/products" prefetch>
              Review menu factors
            </Link>
          </p>
        </article>
      </section>

      <CalculationExplainer title="How carbon from waste is calculated">
        <CarbonCalculationCopy />
      </CalculationExplainer>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Compliance checklist</h2>
            <p>Steps before making carbon claims to customers</p>
          </div>
        </div>
        <ul className="empco-checklist">
          {data.empco.checklist.map((item) => (
            <li className={item.done ? "done" : undefined} key={item.id}>
              <ChecklistMarker done={item.done} />
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-app trend-panel">
        <div className="panel-head-app">
          <div>
            <h2>{periodDays}-day carbon trend</h2>
            <p>Daily CO₂e from logged waste</p>
          </div>
          <span>{formatCo2e(data.carbon.summary.totalCo2eG)} total</span>
        </div>
        <div className="carbon-trend-chart" role="img" aria-label="Carbon trend chart">
          {carbonTrend.map((day) => {
            const max = Math.max(...carbonTrend.map((entry) => entry.totalCo2eG ?? 0), 1);
            const co2 = day.totalCo2eG ?? 0;
            const height = Math.max((co2 / max) * 100, co2 > 0 ? 8 : 4);
            return (
              <div className="trend-bar-wrap" key={day.date}>
                <div className="trend-bar-meta">
                  <small>{co2 > 0 ? formatCo2e(co2) : "—"}</small>
                </div>
                <div
                  className={`trend-bar carbon${co2 === 0 ? " empty" : ""}`}
                  style={{ height: `${height}%` }}
                />
                <span>{new Date(`${day.date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" })}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel-app">
        <div className="panel-head-app">
          <div>
            <h2>Menu carbon factors</h2>
            <p>Grams CO₂e per unit — edit on Products</p>
          </div>
        </div>
        <div className="ranked-list ranked-list-detailed">
          {data.products
            .filter((product) => product.isActive)
            .map((product) => (
              <div className="ranked-row-detailed" key={product.id}>
                <span className="rank-index">·</span>
                <div className="rank-body">
                  <div className="rank-row-head">
                    <strong>{product.name}</strong>
                    <b>
                      {product.unitCo2eG != null
                        ? `${product.unitCo2eG} g CO₂e / ${product.unit}`
                        : "No factor"}
                    </b>
                  </div>
                  <small>Source: {product.co2eSource}</small>
                </div>
              </div>
            ))}
        </div>
      </section>
    </main>
  );
}
