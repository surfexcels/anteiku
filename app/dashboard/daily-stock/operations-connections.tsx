"use client";

import Link from "next/link";

export function DailyStockWasteBridge({
  stockDate,
  wasteCount,
  wasteCostMinor,
  currencyCode,
  dayStatus,
}: {
  stockDate: string;
  wasteCount: number;
  wasteCostMinor: number;
  currencyCode: string;
  dayStatus: "open" | "closed" | null;
}) {
  return (
    <section className="daily-stock-bridge panel-app">
      <div className="panel-head-app">
        <div>
          <span className="daily-stock-bridge-kicker">Daily stock · Log waste</span>
          <h2>Waste for {stockDate}</h2>
          <p>
            Only what you log here (and on this date) subtracts when you close the
            day. For spreadsheet import or browsing all history, use{" "}
            <Link href="/dashboard/waste" prefetch>
              Waste log
            </Link>
            .
          </p>
        </div>
        <div className="daily-stock-bridge-stats">
          <div>
            <span>Logged today</span>
            <strong>{wasteCount}</strong>
          </div>
          <div>
            <span>Cost</span>
            <strong>
              {new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: currencyCode,
              }).format(wasteCostMinor / 100)}
            </strong>
          </div>
          <div>
            <span>Stock day</span>
            <strong>{dayStatus ?? "Not started"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export function WasteLogDailyStockBridge({
  currencyCode,
  inventoryDayStatus,
  stockDate,
  todayWasteCostMinor,
  todayWasteCount,
}: {
  stockDate: string;
  currencyCode: string;
  todayWasteCount: number;
  todayWasteCostMinor: number;
  inventoryDayStatus: "open" | "closed" | null;
}) {
  const inventoryHref = `/dashboard/inventory?date=${stockDate}&tab=${
    inventoryDayStatus === "closed" ? "summary" : inventoryDayStatus === "open" ? "closing" : "opening"
  }`;

  return (
    <section className="waste-daily-bridge">
      <div>
        <span className="waste-daily-bridge-kicker">Tied to daily stock</span>
        <strong>
          {stockDate}: {todayWasteCount} waste entries ·{" "}
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: currencyCode,
          }).format(todayWasteCostMinor / 100)}
        </strong>
        <p>
          {inventoryDayStatus === null
            ? "Open today's stock session to reconcile waste with opening and closing counts."
            : inventoryDayStatus === "open"
              ? "Waste logged today will subtract when you enter closing stock."
              : "Today is closed — waste is locked into the day summary."}
        </p>
      </div>
      <Link className="button primary small" href={inventoryHref} prefetch>
        {inventoryDayStatus === null
          ? "Start daily stock"
          : inventoryDayStatus === "open"
            ? "Go to closing"
            : "View summary"}
      </Link>
    </section>
  );
}
