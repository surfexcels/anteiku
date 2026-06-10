import { formatMoney } from "@/src/lib/format-money";
import type { DailyWasteTrend } from "@/src/modules/waste/domain/waste";
import { CalculationExplainer } from "./calculation-explainer";

function formatDayLabel(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString(undefined, { weekday: "short" });
}

function formatShortDate(date: string) {
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function WasteTrendChart({
  currencyCode,
  periodDays = 7,
  periodTotalMinor,
  trend,
}: {
  currencyCode: string;
  periodDays?: number;
  periodTotalMinor?: number;
  trend: DailyWasteTrend[];
}) {
  const trendTotal = trend.reduce((sum, day) => sum + day.totalCostMinor, 0);
  const displayTotal = periodTotalMinor ?? trendTotal;
  const maxCost = Math.max(...trend.map((day) => day.totalCostMinor), 1);
  const activeDays = trend.filter((day) => day.itemCount > 0).length;
  const hasAnyData = displayTotal > 0 || trend.some((day) => day.itemCount > 0);

  return (
    <section className="panel-app trend-panel">
      <div className="panel-head-app">
        <div>
          <h2>{periodDays}-day waste trend</h2>
          <p>
            Daily cost across the selected period
            {activeDays > 0 ? ` · ${activeDays} active day${activeDays === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <span>{formatMoney(displayTotal, currencyCode)} total</span>
      </div>

      <CalculationExplainer title="How waste cost is calculated">
        <p>
          Each log uses the <strong>unit cost on your menu</strong> at the time you
          saved it: quantity × unit cost. The chart groups entries by{" "}
          <strong>local calendar day</strong> (your browser timezone).
        </p>
        <p>
          The total in the corner matches your period summary — it is the sum of
          all waste logs in the last {periodDays} days, not only the bars shown if
          dates were misaligned before.
        </p>
      </CalculationExplainer>

      {!hasAnyData ? (
        <div className="empty-state-app compact">
          <strong>No waste logged in this period</strong>
          <p>Log waste on Quick close or the waste log tab to see daily patterns.</p>
        </div>
      ) : activeDays <= 1 ? (
        <div className="trend-single-day">
          <div className="trend-single-day-stat">
            <span>Logged on</span>
            <strong>
              {trend.find((day) => day.itemCount > 0)
                ? formatShortDate(trend.find((day) => day.itemCount > 0)!.date)
                : "—"}
            </strong>
          </div>
          <div className="trend-single-day-stat">
            <span>Period total</span>
            <strong>{formatMoney(displayTotal, currencyCode)}</strong>
          </div>
          <p className="trend-single-day-hint">
            Log waste on more days to unlock the daily bar chart.
          </p>
        </div>
      ) : (
        <div
          className={`trend-chart${periodDays > 7 ? " trend-chart-wide" : ""}`}
          role="img"
          aria-label={`${periodDays} day waste cost chart`}
        >
          {trend.map((day) => {
            const height = Math.max(
              (day.totalCostMinor / maxCost) * 100,
              day.itemCount > 0 ? 8 : 4,
            );
            return (
              <div className="trend-bar-wrap" key={day.date}>
                <div className="trend-bar-meta">
                  <small>
                    {day.itemCount > 0 ? formatMoney(day.totalCostMinor, currencyCode) : "—"}
                  </small>
                </div>
                <div
                  className={`trend-bar${day.itemCount === 0 ? " empty" : ""}`}
                  style={{ height: `${height}%` }}
                  title={`${formatShortDate(day.date)}: ${formatMoney(day.totalCostMinor, currencyCode)}`}
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
