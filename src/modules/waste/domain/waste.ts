export interface WasteReason {
  id: string;
  code: string;
  label: string;
}

export interface WasteLog {
  id: string;
  businessProductId: string;
  productName: string;
  wasteReasonId: string | null;
  wasteReasonLabel: string | null;
  quantity: number;
  unitCostMinor: number;
  totalCostMinor: number;
  currencyCode: string;
  occurredAt: string;
  note: string | null;
}

export interface WasteSummary {
  totalCostMinor: number;
  itemCount: number;
  topProducts: Array<{
    productName: string;
    totalCostMinor: number;
    quantity: number;
  }>;
}
