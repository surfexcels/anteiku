import type { WasteLog } from "@/src/modules/waste/domain/waste";

function escapeCsv(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportWasteCsv(logs: WasteLog[], businessName: string) {
  const lines = [
    "Anteiku waste log export",
    `Business,${escapeCsv(businessName)}`,
  ];

  if (logs.length > 0) {
    lines.push(`Currency,${logs[0].currencyCode}`);
  }

  lines.push(
    "",
    "Date,Product,Quantity,Unit cost,Total cost,Unit CO2e (g),Total CO2e (g),Reason,Note",
    ...logs.map((log) =>
      [
        log.occurredAt.slice(0, 10),
        escapeCsv(log.productName),
        log.quantity,
        (log.unitCostMinor / 100).toFixed(2),
        (log.totalCostMinor / 100).toFixed(2),
        log.unitCo2eG?.toFixed(3) ?? "",
        log.totalCo2eG.toFixed(3),
        escapeCsv(log.wasteReasonLabel ?? ""),
        escapeCsv(log.note ?? ""),
      ].join(","),
    ),
  );

  return lines.join("\n");
}
