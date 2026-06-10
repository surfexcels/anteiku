import Link from "next/link";
import { formatMoney } from "@/src/lib/format-money";
import type { PriceMover } from "@/src/modules/waste/domain/waste";

export function PriceMoversPanel({
  movers,
  currencyCode,
}: {
  movers: PriceMover[];
  currencyCode: string;
}) {
  return (
    <section className="panel-app">
      <div className="panel-head-app">
        <div>
          <h2>Price movers</h2>
          <p>Supplier cost changes from your latest invoices</p>
        </div>
        <Link className="text-button-app" href="/dashboard/imports" prefetch>
          All imports
        </Link>
      </div>

      {movers.length === 0 ? (
        <div className="empty-state-app compact">
          <strong>No price changes yet</strong>
          <p>Upload supplier invoices to track creeping ingredient costs.</p>
          <Link className="button primary small" href="/dashboard/imports" prefetch>
            Upload invoice
          </Link>
        </div>
      ) : (
        <div className="price-movers-list">
          {movers.map((mover) => (
            <div className="price-mover-row" key={mover.productName}>
              <div>
                <strong>{mover.productName}</strong>
                <small>
                  {mover.previousPriceMinor !== null
                    ? `${formatMoney(mover.previousPriceMinor, currencyCode)} → ${formatMoney(mover.latestPriceMinor, currencyCode)}`
                    : formatMoney(mover.latestPriceMinor, currencyCode)}
                </small>
              </div>
              {mover.changePercent !== null ? (
                <span className={mover.changePercent > 0 ? "metric-bad" : "metric-good"}>
                  {mover.changePercent > 0 ? "+" : ""}
                  {mover.changePercent}%
                </span>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
