export interface ReportSummary {
  totalCostMinor: number;
  logCount: number;
  topProducts: Array<{ productName: string; totalCostMinor: number }>;
}

export interface Report {
  id: string;
  periodStart: string;
  periodEnd: string;
  summary: ReportSummary;
  createdAt: string;
}
