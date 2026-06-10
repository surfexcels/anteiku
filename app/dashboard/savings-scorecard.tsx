import { formatMoney } from "@/src/lib/format-money";
import type { SavingsOpportunity } from "@/src/modules/waste/domain/waste";

export function SavingsScorecard({
  currencyCode,
  savings,
}: {
  currencyCode: string;
  savings: SavingsOpportunity;
}) {
  if (savings.weeklyCostMinor === 0) return null;

  return (
    <section className="panel-app savings-scorecard">
      <div className="panel-head-app">
        <div>
          <h2>Recoverable margin</h2>
          <p>
            Industry benchmarks show 2–6% food cost recovery when waste is tracked
            consistently.
          </p>
        </div>
      </div>
      <div className="savings-grid">
        <article>
          <span>Weekly waste cost</span>
          <strong>{formatMoney(savings.weeklyCostMinor, currencyCode)}</strong>
        </article>
        <article className="featured">
          <span>Est. annual saving at {Math.round(savings.reductionRate * 100)}% reduction</span>
          <strong>{formatMoney(savings.annualRecoverableMinor, currencyCode)}</strong>
        </article>
      </div>
    </section>
  );
}
