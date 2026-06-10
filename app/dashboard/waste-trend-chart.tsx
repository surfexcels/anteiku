import { formatMoney } from "@/src/lib/format-money";
import type { DailyWasteTrend } from "@/src/modules/waste/domain/waste";

function formatDayLabel(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString(undefined, { weekday: "short" });
}

export function WasteTrendChart({
  currencyCode,
  periodDays = 7,
  trend,
}: {
  currencyCode: string;
  periodDays?: number;
  trend: DailyWasteTrend[];
}) {
  const maxCost = Math.max(...trend.map((day) => day.totalCostMinor), 1);
  const total = trend.reduce((sum, day) => sum + day.totalCostMinor, 0);

  return (
    <section className="panel-app trend-panel">
      <div className="panel-head-app">
        <div>
          <h2>{periodDays}-day waste trend</h2>
          <p>Daily cost across the selected period</p>
        </div>
        <span>{formatMoney(total, currencyCode)} total</span>
      </div>

      {trend.every((day) => day.itemCount === 0) ? (
        <div className="empty-state-app compact">
          <strong>No trend yet</strong>
          <p>Log waste on multiple days to see your pattern.</p>
        </div>
      ) : (
        <div
          className={`trend-chart${periodDays > 7 ? " trend-chart-wide" : ""}`}
          role="img"
          aria-label={`${periodDays} day waste cost chart`}
        >
          {trend.map((day) => {
            const height = Math.max((day.totalCostMinor / maxCost) * 100, day.itemCount > 0 ? 8 : 4);
            return (
              <div className="trend-bar-wrap" key={day.date}>
                <div className="trend-bar-meta">
                  <small>{day.itemCount > 0 ? formatMoney(day.totalCostMinor, currencyCode) : "—"}</small>
                </div>
                <div
                  className={`trend-bar${day.itemCount === 0 ? " empty" : ""}`}
                  style={{ height: `${height}%` }}
                />
                <span>{formatDayLabel(day.date)}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
