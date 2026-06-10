import type {
  WasteLog,
  WasteReason,
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
}

export interface WasteRepository {
  listReasons(businessId: string): Promise<WasteReason[]>;
  listLogs(businessId: string, limit?: number): Promise<WasteLog[]>;
  createLog(input: CreateWasteLogInput): Promise<WasteLog>;
  getSummary(businessId: string, days?: number): Promise<WasteSummary>;
}
