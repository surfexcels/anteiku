import type { InventoryDayDetail } from "@/src/modules/inventory/domain/inventory";
import {
  buildCsvRow,
  formatCsvMoney,
  withCsvBom,
} from "@/src/lib/csv/format-csv";

export function exportInventoryCsv(
  day: InventoryDayDetail,
  businessName: string,
) {
  const lines = [
    buildCsvRow(["Anteiku daily inventory export"]),
    buildCsvRow(["Business", businessName]),
    buildCsvRow(["Date", day.stockDate]),
    buildCsvRow(["Status", day.status]),
    buildCsvRow(["Currency", day.currencyCode]),
    "",
    buildCsvRow([
      "Product",
      "Unit",
      "Opening",
      "Closing",
      "Waste",
      "Usage (sold/consumed)",
      "Variance",
      "Opening value",
      "Closing value",
      "Waste value",
      "Usage value",
      "Variance value",
      "Note",
    ]),
    ...day.lines.map((line) =>
      buildCsvRow([
        line.productName,
        line.unit,
        line.openingQuantity,
        line.closingQuantity ?? "",
        line.wasteQuantity,
        line.usageQuantity ?? "",
        line.varianceQuantity ?? "",
        formatCsvMoney(Math.round(line.openingQuantity * line.unitCostMinor)),
        line.closingQuantity === null
          ? ""
          : formatCsvMoney(
              Math.round(line.closingQuantity * line.unitCostMinor),
            ),
        formatCsvMoney(line.wasteCostMinor),
        line.usageCostMinor === null ? "" : formatCsvMoney(line.usageCostMinor),
        line.varianceQuantity === null
          ? ""
          : formatCsvMoney(
              Math.round(line.varianceQuantity * line.unitCostMinor),
            ),
        line.note ?? "",
      ]),
    ),
    "",
    buildCsvRow(["Totals", "", "", "", "", "", "", "", "", "", "", "", ""]),
    buildCsvRow([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      formatCsvMoney(day.totals.openingCostMinor),
      formatCsvMoney(day.totals.closingCostMinor),
      formatCsvMoney(day.totals.wasteCostMinor),
      formatCsvMoney(day.totals.usageCostMinor),
      formatCsvMoney(day.totals.varianceCostMinor),
      "",
    ]),
    "",
    "Formula: Usage = Opening - Closing - Waste. Variance flags when waste + closing exceeds opening.",
  ];

  return withCsvBom(lines.join("\n"));
}
