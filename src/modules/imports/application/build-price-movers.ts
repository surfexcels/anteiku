import type { SupplierImport } from "@/src/modules/imports/domain/supplier-import";
import type { PriceMover } from "@/src/modules/waste/domain/waste";

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

export function buildPriceMovers(imports: SupplierImport[], limit = 5): PriceMover[] {
  const priceHistory = new Map<
    string,
    { name: string; prices: Array<{ priceMinor: number; at: string }> }
  >();

  for (const entry of imports) {
    if (entry.status !== "completed" || !entry.result?.lineItems?.length) continue;

    for (const line of entry.result.lineItems) {
      if (!line.unitPriceMinor) continue;
      const key = line.matchedProductName
        ? normalizeName(line.matchedProductName)
        : normalizeName(line.description);
      const displayName = line.matchedProductName ?? line.description;
      const current = priceHistory.get(key) ?? { name: displayName, prices: [] };
      current.prices.push({
        priceMinor: line.unitPriceMinor,
        at: entry.completedAt ?? entry.createdAt,
      });
      priceHistory.set(key, current);
    }
  }

  const movers: PriceMover[] = [];

  for (const { name, prices } of priceHistory.values()) {
    if (prices.length < 2) continue;
    prices.sort((left, right) => left.at.localeCompare(right.at));
    const previous = prices[prices.length - 2];
    const latest = prices[prices.length - 1];
    if (previous.priceMinor === latest.priceMinor) continue;

    const changePercent = Number(
      (
        ((latest.priceMinor - previous.priceMinor) / previous.priceMinor) *
        100
      ).toFixed(1),
    );

    movers.push({
      productName: name,
      previousPriceMinor: previous.priceMinor,
      latestPriceMinor: latest.priceMinor,
      changePercent,
    });
  }

  return movers
    .sort(
      (left, right) =>
        Math.abs(right.changePercent ?? 0) - Math.abs(left.changePercent ?? 0),
    )
    .slice(0, limit);
}
