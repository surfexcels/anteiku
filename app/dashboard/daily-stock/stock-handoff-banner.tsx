"use client";

import type { InventoryDayDetail } from "@/src/modules/inventory/domain/inventory";

export function StockHandoffBanner({
  priorDay,
  stockDate,
}: {
  priorDay: InventoryDayDetail | null;
  stockDate: string;
}) {
  if (!priorDay || priorDay.stockDate >= stockDate) return null;

  const closingLines = priorDay.lines.filter(
    (line) => line.closingQuantity !== null && line.closingQuantity > 0,
  );

  if (closingLines.length === 0) return null;

  return (
    <section className="stock-handoff-banner">
      <div>
        <span className="stock-handoff-kicker">Carry forward</span>
        <strong>
          {priorDay.stockDate} closing → {stockDate} opening
        </strong>
        <p>
          Yesterday&apos;s closing counts can pre-fill today&apos;s opening stock.
          Adjust anything that changed overnight, then save opening.
        </p>
      </div>
      <div className="stock-handoff-preview">
        {closingLines.slice(0, 4).map((line) => (
          <div key={line.businessProductId}>
            <span>{line.productName}</span>
            <em>{line.closingQuantity}</em>
          </div>
        ))}
        {closingLines.length > 4 ? (
          <small>+{closingLines.length - 4} more items</small>
        ) : null}
      </div>
    </section>
  );
}

export function StockHandoffNextDay({
  closedDay,
  nextStockDate,
  onStartNextDay,
}: {
  closedDay: InventoryDayDetail;
  nextStockDate: string;
  onStartNextDay: () => void;
}) {
  return (
    <section className="stock-handoff-next panel-app">
      <div className="panel-head-app">
        <div>
          <h2>Hand off to tomorrow</h2>
          <p>
            Closing counts from {closedDay.stockDate} become opening stock for{" "}
            {nextStockDate}.
          </p>
        </div>
      </div>
      <button className="button primary" onClick={onStartNextDay} type="button">
        Start {nextStockDate} with these closing counts
      </button>
    </section>
  );
}
