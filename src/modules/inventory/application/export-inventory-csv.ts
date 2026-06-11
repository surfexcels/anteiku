import type { InventoryDayDetail } from "@/src/modules/inventory/domain/inventory";
import { formatMoney } from "@/src/lib/format-money";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportInventoryCsv(
  day: InventoryDayDetail,
  businessName: string,
) {
  const lines = [
    "Anteiku daily inventory export",
    `Business,${escapeCsv(businessName)}`,
    `Date,${day.stockDate}`,
    `Status,${day.status}`,
    `Currency,${day.currencyCode}`,
    "",
    "Product,Unit,Opening,Closing,Waste,Usage (sold/consumed),Variance,Opening value,Closing value,Waste value,Usage value,Variance value,Note",
    ...day.lines.map((line) =>
      [
        escapeCsv(line.productName),
        line.unit,
        line.openingQuantity,
        line.closingQuantity ?? "",
        line.wasteQuantity,
        line.usageQuantity ?? "",
        line.varianceQuantity ?? "",
        formatMoney(
          Math.round(line.openingQuantity * line.unitCostMinor),
          day.currencyCode,
        ),
        line.closingQuantity === null
          ? ""
          : formatMoney(
              Math.round(line.closingQuantity * line.unitCostMinor),
              day.currencyCode,
            ),
        formatMoney(line.wasteCostMinor, day.currencyCode),
        line.usageCostMinor === null
          ? ""
          : formatMoney(line.usageCostMinor, day.currencyCode),
        line.varianceQuantity === null
          ? ""
          : formatMoney(
              Math.round(line.varianceQuantity * line.unitCostMinor),
              day.currencyCode,
            ),
        escapeCsv(line.note ?? ""),
      ].join(","),
    ),
    "",
    "Totals,,,,,,,",
    [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      formatMoney(day.totals.openingCostMinor, day.currencyCode),
      formatMoney(day.totals.closingCostMinor, day.currencyCode),
      formatMoney(day.totals.wasteCostMinor, day.currencyCode),
      formatMoney(day.totals.usageCostMinor, day.currencyCode),
      formatMoney(day.totals.varianceCostMinor, day.currencyCode),
      "",
    ].join(","),
    "",
    "Formula: Usage = Opening - Closing - Waste. Variance flags when waste + closing exceeds opening.",
  ];

  return `\uFEFF${lines.join("\n")}`;
}
