export type InventoryDayStatus = "open" | "closed";

export interface InventoryDaySummary {
  id: string;
  stockDate: string;
  status: InventoryDayStatus;
  lineCount: number;
  openedAt: string | null;
  closedAt: string | null;
}

export interface InventoryLineReconciliation {
  id: string;
  businessProductId: string;
  productName: string;
  unit: string;
  unitCostMinor: number;
  openingQuantity: number;
  closingQuantity: number | null;
  wasteQuantity: number;
  wasteCostMinor: number;
  usageQuantity: number | null;
  usageCostMinor: number | null;
  varianceQuantity: number | null;
  note: string | null;
}

export interface InventoryDayDetail {
  id: string;
  stockDate: string;
  status: InventoryDayStatus;
  note: string | null;
  openedAt: string | null;
  closedAt: string | null;
  currencyCode: string;
  lines: InventoryLineReconciliation[];
  totals: {
    openingCostMinor: number;
    closingCostMinor: number;
    wasteCostMinor: number;
    usageCostMinor: number;
    varianceCostMinor: number;
  };
}

export interface InventoryLineInput {
  businessProductId: string;
  openingQuantity: number;
  closingQuantity?: number | null;
  note?: string | null;
}
