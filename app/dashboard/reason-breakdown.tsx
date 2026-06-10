import { formatMoney } from "@/src/lib/format-money";
import type { WasteReasonBreakdown } from "@/src/modules/waste/domain/waste";

export function ReasonBreakdown({
  breakdown,
  currencyCode,
}: {
  breakdown: WasteReasonBreakdown[];
  currencyCode: string;
}) {
  const maxCost = Math.max(...breakdown.map((item) => item.totalCostMinor), 1);

  return (
    <section className="panel-app">
      <div className="panel-head-app">
        <div>
          <h2>Why waste happened</h2>
          <p>Replaces the reason column owners track in spreadsheets</p>
        </div>
      </div>
      {breakdown.length === 0 ? (
        <div className="empty-state-app compact">
          <strong>No reasons logged yet</strong>
          <p>Pick a reason during quick close to see patterns here.</p>
        </div>
      ) : (
        <div className="reason-breakdown-list">
          {breakdown.map((item) => (
            <article key={item.reasonLabel}>
              <div className="reason-row-head">
                <strong>{item.reasonLabel}</strong>
                <span>{formatMoney(item.totalCostMinor, currencyCode)}</span>
              </div>
              <div className="reason-bar-track">
                <div
                  className="reason-bar-fill"
                  style={{ width: `${(item.totalCostMinor / maxCost) * 100}%` }}
                />
              </div>
              <small>{item.itemCount} entries</small>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
