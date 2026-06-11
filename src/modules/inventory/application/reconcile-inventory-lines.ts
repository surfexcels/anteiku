import type { InventoryLineReconciliation } from "@/src/modules/inventory/domain/inventory";

export function reconcileInventoryLine(input: {
  id: string;
  businessProductId: string;
  productName: string;
  unit: string;
  unitCostMinor: number;
  openingQuantity: number;
  closingQuantity: number | null;
  wasteQuantity: number;
  note: string | null;
}): InventoryLineReconciliation {
  const wasteCostMinor = Math.round(input.wasteQuantity * input.unitCostMinor);
  let usageQuantity: number | null = null;
  let usageCostMinor: number | null = null;
  let varianceQuantity: number | null = null;

  if (input.closingQuantity !== null) {
    const rawUsage =
      input.openingQuantity - input.closingQuantity - input.wasteQuantity;
    if (rawUsage < 0) {
      varianceQuantity = Number(Math.abs(rawUsage).toFixed(3));
      usageQuantity = 0;
      usageCostMinor = 0;
    } else {
      usageQuantity = Number(rawUsage.toFixed(3));
      usageCostMinor = Math.round(usageQuantity * input.unitCostMinor);
    }
  }

  return {
    id: input.id,
    businessProductId: input.businessProductId,
    productName: input.productName,
    unit: input.unit,
    unitCostMinor: input.unitCostMinor,
    openingQuantity: input.openingQuantity,
    closingQuantity: input.closingQuantity,
    wasteQuantity: input.wasteQuantity,
    wasteCostMinor,
    usageQuantity,
    usageCostMinor,
    varianceQuantity,
    note: input.note,
  };
}

export function sumInventoryTotals(lines: InventoryLineReconciliation[]) {
  return lines.reduce(
    (totals, line) => ({
      openingCostMinor:
        totals.openingCostMinor +
        Math.round(line.openingQuantity * line.unitCostMinor),
      closingCostMinor:
        totals.closingCostMinor +
        Math.round((line.closingQuantity ?? 0) * line.unitCostMinor),
      wasteCostMinor: totals.wasteCostMinor + line.wasteCostMinor,
      usageCostMinor: totals.usageCostMinor + (line.usageCostMinor ?? 0),
      varianceCostMinor:
        totals.varianceCostMinor +
        Math.round((line.varianceQuantity ?? 0) * line.unitCostMinor),
    }),
    {
      openingCostMinor: 0,
      closingCostMinor: 0,
      wasteCostMinor: 0,
      usageCostMinor: 0,
      varianceCostMinor: 0,
    },
  );
}
