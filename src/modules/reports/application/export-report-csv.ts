import type { Report } from "@/src/modules/reports/domain/report";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportReportCsv(report: Report, currencyCode: string) {
  const lines = [
    "Anteiku waste report",
    `Period,${report.periodStart} to ${report.periodEnd}`,
    `Currency,${currencyCode}`,
    `Total waste cost,${(report.summary.totalCostMinor / 100).toFixed(2)}`,
    `Entries,${report.summary.logCount}`,
    "",
    "Product,Cost",
    ...report.summary.topProducts.map(
      (product) =>
        `${escapeCsv(product.productName)},${(product.totalCostMinor / 100).toFixed(2)}`,
    ),
  ];

  return lines.join("\n");
}
