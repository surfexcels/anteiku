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

export interface WasteLogRecord extends WasteLog {
  createdBy: string;
  locationId: string;
}

export interface WasteRepository {
  listReasons(businessId: string): Promise<WasteReason[]>;
  listLogs(
    businessId: string,
    locationId: string,
    limit?: number,
  ): Promise<WasteLog[]>;
  listLogsForDate(
    businessId: string,
    stockDate: string,
    locationId: string,
  ): Promise<WasteLog[]>;
  getLog(businessId: string, logId: string): Promise<WasteLogRecord | null>;
  deleteLog(businessId: string, logId: string): Promise<void>;
  listLogsForExport(
    businessId: string,
    days: number,
    locationId: string,
  ): Promise<Array<WasteLog & { locationName: string | null }>>;
  createLog(input: CreateWasteLogInput): Promise<WasteLog>;
  createLogsBatch(input: CreateBatchWasteLogsInput): Promise<WasteLog[]>;
  getSummary(
    businessId: string,
    locationId: string,
    days?: number,
  ): Promise<WasteSummary>;
  getDailyTrend(
    businessId: string,
    locationId: string,
    days?: number,
  ): Promise<DailyWasteTrend[]>;
  getReasonBreakdown(
    businessId: string,
    locationId: string,
    days?: number,
  ): Promise<WasteReasonBreakdown[]>;
  getPeriodComparison(
    businessId: string,
    locationId: string,
    days?: number,
  ): Promise<WastePeriodComparison>;
  getOverviewAnalytics(
    businessId: string,
    locationId: string,
    days?: number,
  ): Promise<OverviewAnalytics>;
}
