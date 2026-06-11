import type {
  InventoryDayDetail,
  InventoryDaySummary,
  InventoryLineInput,
} from "@/src/modules/inventory/domain/inventory";

export interface InventoryRepository {
  listRecentDays(
    businessId: string,
    locationId: string,
    limit?: number,
  ): Promise<InventoryDaySummary[]>;

  getDayByDate(
    businessId: string,
    locationId: string,
    stockDate: string,
  ): Promise<InventoryDayDetail | null>;

  getDayById(
    businessId: string,
    dayId: string,
  ): Promise<InventoryDayDetail | null>;

  openDay(input: {
    businessId: string;
    locationId: string;
    stockDate: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
    carryForward?: boolean;
  }): Promise<InventoryDayDetail>;

  updateOpening(input: {
    businessId: string;
    dayId: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
  }): Promise<InventoryDayDetail>;

  closeDay(input: {
    businessId: string;
    dayId: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
  }): Promise<InventoryDayDetail>;
}
