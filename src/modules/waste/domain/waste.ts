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
  unitCo2eG: number | null;
  totalCo2eG: number;
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

export interface DailyWasteTrend {
  date: string;
  totalCostMinor: number;
  itemCount: number;
}

export interface WasteReasonBreakdown {
  reasonLabel: string;
  totalCostMinor: number;
  itemCount: number;
}

export interface WastePeriodComparison {
  currentTotalCostMinor: number;
  previousTotalCostMinor: number;
  changePercent: number | null;
}

export interface SavingsOpportunity {
  weeklyCostMinor: number;
  annualRecoverableMinor: number;
  reductionRate: number;
}

export interface OverviewAnalytics {
  summary: WasteSummary;
  trend: DailyWasteTrend[];
  comparison: WastePeriodComparison;
  reasonBreakdown: WasteReasonBreakdown[];
  carbon: {
    summary: {
      totalCo2eG: number;
      itemCount: number;
      topProducts: Array<{
        productName: string;
        totalCo2eG: number;
        quantity: number;
      }>;
    };
    trend: Array<{
      date: string;
      totalCo2eG: number;
      itemCount: number;
    }>;
    comparison: {
      currentTotalCo2eG: number;
      previousTotalCo2eG: number;
      changePercent: number | null;
    };
  };
}

export interface OverviewAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  href?: string;
  actionLabel?: string;
}

export interface PriceMover {
  productName: string;
  previousPriceMinor: number | null;
  latestPriceMinor: number;
  changePercent: number | null;
  supplierHint?: string;
}

export interface BudgetPacing {
  periodDays: number;
  actualCostMinor: number;
  targetCostMinor: number;
  percentUsed: number;
  status: "under" | "on_track" | "over";
}
