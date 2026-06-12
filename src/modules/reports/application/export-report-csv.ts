import type { Report } from "@/src/modules/reports/domain/report";
import {
  buildCsvRow,
  formatCsvMoney,
  withCsvBom,
} from "@/src/lib/csv/format-csv";

export function exportReportCsv(report: Report, currencyCode: string) {
  const lines = [
    buildCsvRow(["Anteiku waste report"]),
    buildCsvRow(["Period", `${report.periodStart} to ${report.periodEnd}`]),
    buildCsvRow(["Currency", currencyCode]),
    buildCsvRow([
      "Total waste cost",
      formatCsvMoney(report.summary.totalCostMinor),
    ]),
    buildCsvRow(["Entries", report.summary.logCount]),
    "",
    buildCsvRow(["Product", "Cost"]),
    ...report.summary.topProducts.map((product) =>
      buildCsvRow([
        product.productName,
        formatCsvMoney(product.totalCostMinor),
      ]),
    ),
  ];

  return withCsvBom(lines.join("\n"));
}
