import type {
  DailyWasteTrend,
  OverviewAnalytics,
  WasteLog,
  WastePeriodComparison,
  WasteReason,
  WasteReasonBreakdown,
  WasteSummary,
} from "@/src/modules/waste/domain/waste";

export interface CreateWasteLogInput {
  businessId: string;
  locationId: string;
  userId: string;
  businessProductId: string;
  wasteReasonId?: string;
  quantity: number;
  note?: string;
  occurredAt?: string;
  source?: "manual" | "import";
}

export interface BatchWasteLogEntry {
  businessProductId: string;
  quantity: number;
  note?: string;
  occurredAt?: string;
}

export interface CreateBatchWasteLogsInput {
  businessId: string;
  locationId: string;
  userId: string;
  wasteReasonId?: string;
  note?: string;
  entries: BatchWasteLogEntry[];
  source?: "manual" | "import";
}

export interface WasteRepository {
  listReasons(businessId: string): Promise<WasteReason[]>;
  listLogs(businessId: string, limit?: number): Promise<WasteLog[]>;
  listLogsForExport(businessId: string, days: number): Promise<WasteLog[]>;
  createLog(input: CreateWasteLogInput): Promise<WasteLog>;
  createLogsBatch(input: CreateBatchWasteLogsInput): Promise<WasteLog[]>;
  getSummary(businessId: string, days?: number): Promise<WasteSummary>;
  getDailyTrend(businessId: string, days?: number): Promise<DailyWasteTrend[]>;
  getReasonBreakdown(
    businessId: string,
    days?: number,
  ): Promise<WasteReasonBreakdown[]>;
  getPeriodComparison(
    businessId: string,
    days?: number,
  ): Promise<WastePeriodComparison>;
  getOverviewAnalytics(businessId: string, days?: number): Promise<OverviewAnalytics>;
}
