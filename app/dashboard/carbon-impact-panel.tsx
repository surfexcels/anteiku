import Link from "next/link";
import { formatCo2e } from "@/src/modules/sustainability/application/carbon-equivalencies";
import type { CarbonOverviewAnalytics } from "@/src/modules/sustainability/domain/carbon";

export function CarbonImpactPanel({
  carbon,
  periodDays,
  equivalencies,
}: {
  carbon: CarbonOverviewAnalytics;
  periodDays: number;
  equivalencies: { carKm: number; smartphoneCharges: number };
}) {
  const change = carbon.comparison.changePercent;

  return (
    <section className="panel-app carbon-impact-panel">
      <div className="panel-head-app">
        <div>
          <h2>Carbon from food waste</h2>
          <p>
            CO₂e linked to wasted menu items — supports EU EmpCo substantiation
            (Directive 2024/825).
          </p>
        </div>
        <Link className="text-button-app" href="/dashboard/sustainability" prefetch>
          Compliance hub
        </Link>
      </div>

      <div className="carbon-impact-grid">
        <article className="carbon-stat featured">
          <span>Waste emissions ({periodDays} days)</span>
          <strong>{formatCo2e(carbon.summary.totalCo2eG)}</strong>
          <p>
            {carbon.summary.itemCount} entries
            {change !== null && (
              <>
                {" "}
                ·{" "}
                <span className={change <= 0 ? "metric-good" : "metric-bad"}>
                  {change > 0 ? "+" : ""}
                  {change}% vs prior period
                </span>
              </>
            )}
          </p>
        </article>
        <article className="carbon-stat">
          <span>Equivalent driving</span>
          <strong>{equivalencies.carKm} km</strong>
          <p>Passenger car (EU average grid mix)</p>
        </article>
        <article className="carbon-stat">
          <span>Phone charges</span>
          <strong>{equivalencies.smartphoneCharges}</strong>
          <p>Indicative equivalency for staff briefings</p>
        </article>
      </div>
    </section>
  );
}
