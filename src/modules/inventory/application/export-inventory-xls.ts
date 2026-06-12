import type { InventoryDayDetail } from "@/src/modules/inventory/domain/inventory";
import { formatCsvMoney } from "@/src/lib/csv/format-csv";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string | number, type: "String" | "Number" = "String") {
  if (type === "Number" && typeof value === "number") {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${xmlEscape(String(value))}</Data></Cell>`;
}

function row(cells: Array<string | number>, types?: Array<"String" | "Number">) {
  const body = cells
    .map((value, index) => cell(value, types?.[index] ?? "String"))
    .join("");
  return `<Row>${body}</Row>`;
}

export function exportInventoryXls(
  day: InventoryDayDetail,
  businessName: string,
) {
  const headerRows = [
    row(["Anteiku daily inventory"]),
    row(["Business", businessName]),
    row(["Date", day.stockDate]),
    row(["Status", day.status]),
    row(["Currency", day.currencyCode]),
    row([""]),
    row([
      "Product",
      "Unit",
      "Opening",
      "Closing",
      "Waste",
      "Usage",
      "Variance",
      "Opening value",
      "Closing value",
      "Waste value",
      "Usage value",
      "Variance value",
      "Note",
    ]),
  ];

  const dataRows = day.lines.map((line) =>
    row(
      [
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
        line.usageCostMinor === null
          ? ""
          : formatCsvMoney(line.usageCostMinor),
        line.varianceQuantity === null
          ? ""
          : formatCsvMoney(
              Math.round(line.varianceQuantity * line.unitCostMinor),
            ),
        line.note ?? "",
      ],
      [
        "String",
        "String",
        "Number",
        "String",
        "Number",
        "String",
        "String",
        "String",
        "String",
        "String",
        "String",
        "String",
        "String",
      ],
    ),
  );

  const totalRow = row([
    "Totals",
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
  ]);

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Inventory">
<Table>
${[...headerRows, ...dataRows, row([""]), totalRow].join("\n")}
</Table>
</Worksheet>
</Workbook>`;
}
