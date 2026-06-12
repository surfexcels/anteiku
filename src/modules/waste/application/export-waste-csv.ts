import type { WasteLog } from "@/src/modules/waste/domain/waste";
import {
  buildCsvRow,
  formatCsvMoney,
  formatCsvNumber,
  withCsvBom,
} from "@/src/lib/csv/format-csv";

export interface WasteLogExportRow extends WasteLog {
  locationName?: string | null;
}

export function exportWasteCsv(
  logs: WasteLogExportRow[],
  businessName: string,
) {
  const lines = [
    buildCsvRow(["Anteiku waste log export"]),
    buildCsvRow(["Business", businessName]),
  ];

  if (logs.length > 0) {
    lines.push(buildCsvRow(["Currency", logs[0].currencyCode]));
  }

  lines.push(
    "",
    buildCsvRow([
      "Date",
      "Location",
      "Product",
      "Quantity",
      "Unit cost",
      "Total cost",
      "Unit CO2e (g)",
      "Total CO2e (g)",
      "Reason",
      "Note",
    ]),
    ...logs.map((log) =>
      buildCsvRow([
        log.occurredAt.slice(0, 10),
        log.locationName ?? "",
        log.productName,
        log.quantity,
        formatCsvMoney(log.unitCostMinor),
        formatCsvMoney(log.totalCostMinor),
        log.unitCo2eG === null ? "" : formatCsvNumber(log.unitCo2eG, 3),
        formatCsvNumber(log.totalCo2eG, 3),
        log.wasteReasonLabel ?? "",
        log.note ?? "",
      ]),
    ),
  );

  return withCsvBom(lines.join("\n"));
}
