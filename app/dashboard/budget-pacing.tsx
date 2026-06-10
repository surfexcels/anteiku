import { formatMoney } from "@/src/lib/format-money";
import type { BudgetPacing } from "@/src/modules/waste/domain/waste";

const STATUS_COPY: Record<BudgetPacing["status"], string> = {
  under: "Under pace — good control",
  on_track: "On pace with last period",
  over: "Over pace — review top waste",
};

export function BudgetPacingPanel({
  pacing,
  currencyCode,
}: {
  pacing: BudgetPacing;
  currencyCode: string;
}) {
  const barWidth = Math.min(pacing.percentUsed, 100);

  return (
    <section className="panel-app budget-pacing-panel">
      <div className="panel-head-app">
        <div>
          <h2>Waste budget pacing</h2>
          <p>
            Compared to the previous {pacing.periodDays} days — stay flat or
            improve.
          </p>
        </div>
        <span className={`pace-pill ${pacing.status}`}>{STATUS_COPY[pacing.status]}</span>
      </div>

      <div className="pace-stats">
        <div>
          <span>Actual</span>
          <strong>{formatMoney(pacing.actualCostMinor, currencyCode)}</strong>
        </div>
        <div>
          <span>Target (last period)</span>
          <strong>{formatMoney(pacing.targetCostMinor, currencyCode)}</strong>
        </div>
        <div>
          <span>Pace</span>
          <strong>{pacing.percentUsed}%</strong>
        </div>
      </div>

      <div className="pace-bar-track" aria-hidden>
        <div className={`pace-bar-fill ${pacing.status}`} style={{ width: `${barWidth}%` }} />
      </div>
    </section>
  );
}
