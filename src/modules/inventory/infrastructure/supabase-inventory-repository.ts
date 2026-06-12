import type { SupabaseClient } from "@supabase/supabase-js";
import { localDateKey } from "@/src/lib/date/local-date-key";
import { normalizeQuantity } from "@/src/lib/inventory/quantity-step";
import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";
import type { InventoryRepository } from "@/src/modules/inventory/application/inventory-repository";
import {
  reconcileInventoryLine,
  sumInventoryTotals,
} from "@/src/modules/inventory/application/reconcile-inventory-lines";
import type {
  InventoryDayDetail,
  InventoryDaySummary,
  InventoryLineInput,
} from "@/src/modules/inventory/domain/inventory";

interface InventoryDayRow {
  id: string;
  location_id: string;
  stock_date: string;
  status: "open" | "closed";
  note: string | null;
  opened_at: string | null;
  closed_at: string | null;
}

interface InventoryLineRow {
  id: string;
  business_product_id: string;
  opening_quantity: number;
  closing_quantity: number | null;
  note: string | null;
  business_products:
    | {
        name: string;
        unit: string;
        unit_cost_minor: number;
        currency_code: string;
      }
    | {
        name: string;
        unit: string;
        unit_cost_minor: number;
        currency_code: string;
      }[]
    | null;
}

interface WasteAggregateRow {
  business_product_id: string;
  quantity: number;
  total_cost_minor: number;
}

const LINE_SELECT =
  "id, business_product_id, opening_quantity, closing_quantity, note, business_products(name, unit, unit_cost_minor, currency_code)";

function relationProduct<T extends { name: string }>(
  value: T | T[] | null | undefined,
) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function previousDate(stockDate: string) {
  const date = new Date(`${stockDate}T12:00:00`);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

export class SupabaseInventoryRepository implements InventoryRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listRecentDays(
    businessId: string,
    locationId: string,
    limit = 14,
  ): Promise<InventoryDaySummary[]> {
    const { data, error } = await this.supabase
      .from("inventory_days")
      .select("id, stock_date, status, opened_at, closed_at, inventory_day_lines(count)")
      .eq("business_id", businessId)
      .eq("location_id", locationId)
      .order("stock_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => {
      const lines = row.inventory_day_lines as { count: number }[] | { count: number } | null;
      const lineCount = Array.isArray(lines)
        ? lines[0]?.count ?? 0
        : lines?.count ?? 0;

      return {
        id: row.id,
        stockDate: row.stock_date,
        status: row.status,
        lineCount,
        openedAt: row.opened_at,
        closedAt: row.closed_at,
      };
    });
  }

  async getDayByDate(
    businessId: string,
    locationId: string,
    stockDate: string,
  ): Promise<InventoryDayDetail | null> {
    const { data, error } = await this.supabase
      .from("inventory_days")
      .select("id")
      .eq("business_id", businessId)
      .eq("location_id", locationId)
      .eq("stock_date", stockDate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return this.getDayById(businessId, data.id);
  }

  async getDayById(
    businessId: string,
    dayId: string,
  ): Promise<InventoryDayDetail | null> {
    const { data: day, error: dayError } = await this.supabase
      .from("inventory_days")
      .select("id, location_id, stock_date, status, note, opened_at, closed_at")
      .eq("business_id", businessId)
      .eq("id", dayId)
      .maybeSingle();

    if (dayError) throw dayError;
    if (!day) return null;

    return this.buildDayDetail(businessId, day as InventoryDayRow);
  }

  async openDay(input: {
    businessId: string;
    locationId: string;
    stockDate: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
    carryForward?: boolean;
  }): Promise<InventoryDayDetail> {
    const existing = await this.getDayByDate(
      input.businessId,
      input.locationId,
      input.stockDate,
    );
    if (existing) {
      throw new Error("Inventory day already exists for this date.");
    }

    let lines = input.lines;
    if (input.carryForward) {
      lines = await this.applyCarryForward(
        input.businessId,
        input.locationId,
        input.stockDate,
        lines,
      );
    }

    const { data: day, error: dayError } = await this.supabase
      .from("inventory_days")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId,
        stock_date: input.stockDate,
        status: "open",
        note: input.note ?? null,
        opened_at: new Date().toISOString(),
        opened_by: input.userId,
        created_by: input.userId,
      })
      .select("id, location_id, stock_date, status, note, opened_at, closed_at")
      .single();

    if (dayError) throw dayError;

    await this.upsertLines(input.businessId, day.id, lines);

    const detail = await this.buildDayDetail(
      input.businessId,
      day as InventoryDayRow,
    );
    if (!detail) throw new Error("Could not load created inventory day.");
    return detail;
  }

  async updateOpening(input: {
    businessId: string;
    dayId: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
  }): Promise<InventoryDayDetail> {
    const current = await this.getDayById(input.businessId, input.dayId);
    if (!current) throw new Error("Inventory day not found.");
    if (current.status === "closed") {
      throw new Error("Cannot edit opening stock on a closed day.");
    }

    const { error } = await this.supabase
      .from("inventory_days")
      .update({
        note: input.note ?? current.note,
        opened_at: current.openedAt ?? new Date().toISOString(),
        opened_by: input.userId,
      })
      .eq("business_id", input.businessId)
      .eq("id", input.dayId);

    if (error) throw new Error(error.message);

    await this.upsertLines(input.businessId, input.dayId, input.lines);

    const detail = await this.getDayById(input.businessId, input.dayId);
    if (!detail) throw new Error("Could not load updated inventory day.");
    return detail;
  }

  async closeDay(input: {
    businessId: string;
    dayId: string;
    userId: string;
    lines: InventoryLineInput[];
    note?: string | null;
  }): Promise<InventoryDayDetail> {
    const current = await this.getDayById(input.businessId, input.dayId);
    if (!current) throw new Error("Inventory day not found.");
    if (current.status === "closed") {
      throw new Error("This inventory day is already closed.");
    }

    const { error } = await this.supabase
      .from("inventory_days")
      .update({
        status: "closed",
        note: input.note ?? current.note,
        closed_at: new Date().toISOString(),
        closed_by: input.userId,
      })
      .eq("business_id", input.businessId)
      .eq("id", input.dayId);

    if (error) throw new Error(error.message);

    await this.upsertLines(input.businessId, input.dayId, input.lines, true);

    const detail = await this.getDayById(input.businessId, input.dayId);
    if (!detail) throw new Error("Could not load closed inventory day.");
    return detail;
  }

  private async applyCarryForward(
    businessId: string,
    locationId: string,
    stockDate: string,
    lines: InventoryLineInput[],
  ) {
    const prior = await this.getDayByDate(
      businessId,
      locationId,
      previousDate(stockDate),
    );
    if (!prior) return lines;

    const closingByProduct = new Map(
      prior.lines.map((line) => [line.businessProductId, line.closingQuantity ?? 0]),
    );

    const unitByProduct = new Map(
      prior.lines.map((line) => [line.businessProductId, line.unit as ProductUnit]),
    );

    return lines.map((line) => {
      const unit = unitByProduct.get(line.businessProductId) ?? "item";
      const carried = closingByProduct.get(line.businessProductId);
      return {
        ...line,
        openingQuantity:
          carried !== undefined
            ? normalizeQuantity(carried, unit)
            : line.openingQuantity,
      };
    });
  }

  private async upsertLines(
    businessId: string,
    dayId: string,
    lines: InventoryLineInput[],
    closingRequired = false,
  ) {
    const payload = lines.map((line) => ({
      inventory_day_id: dayId,
      business_id: businessId,
      business_product_id: line.businessProductId,
      opening_quantity: line.openingQuantity,
      closing_quantity:
        closingRequired && line.closingQuantity !== undefined
          ? line.closingQuantity
          : line.closingQuantity ?? null,
      note: line.note ?? null,
    }));

    // Replace lines instead of upsert: a legacy DB trigger on UPDATE references
    // created_by, which this table does not have (see migration 20260610170000).
    const { error: deleteError } = await this.supabase
      .from("inventory_day_lines")
      .delete()
      .eq("business_id", businessId)
      .eq("inventory_day_id", dayId);

    if (deleteError) throw new Error(deleteError.message);
    if (payload.length === 0) return;

    const { error: insertError } = await this.supabase
      .from("inventory_day_lines")
      .insert(payload);

    if (insertError) throw new Error(insertError.message);
  }

  private async buildDayDetail(
    businessId: string,
    day: InventoryDayRow,
  ): Promise<InventoryDayDetail | null> {
    const { data: lineRows, error: lineError } = await this.supabase
      .from("inventory_day_lines")
      .select(LINE_SELECT)
      .eq("business_id", businessId)
      .eq("inventory_day_id", day.id)
      .order("business_product_id");

    if (lineError) throw lineError;

    const wasteByProduct = await this.wasteByProductForDate(
      businessId,
      day.location_id,
      day.stock_date,
    );

    const reconciled = (lineRows as InventoryLineRow[]).map((row) => {
      const product = relationProduct(row.business_products);
      const waste = wasteByProduct.get(row.business_product_id) ?? {
        quantity: 0,
        totalCostMinor: 0,
      };

      return reconcileInventoryLine({
        id: row.id,
        businessProductId: row.business_product_id,
        productName: product?.name ?? "Unknown product",
        unit: product?.unit ?? "item",
        unitCostMinor: product?.unit_cost_minor ?? 0,
        openingQuantity: Number(row.opening_quantity),
        closingQuantity:
          row.closing_quantity === null ? null : Number(row.closing_quantity),
        wasteQuantity: waste.quantity,
        note: row.note,
      });
    });

    const currencyCode =
      relationProduct((lineRows as InventoryLineRow[])[0]?.business_products)
        ?.currency_code ?? "EUR";

    return {
      id: day.id,
      stockDate: day.stock_date,
      status: day.status,
      note: day.note,
      openedAt: day.opened_at,
      closedAt: day.closed_at,
      currencyCode,
      lines: reconciled.sort((left, right) =>
        left.productName.localeCompare(right.productName),
      ),
      totals: sumInventoryTotals(reconciled),
    };
  }

  private async wasteByProductForDate(
    businessId: string,
    locationId: string,
    stockDate: string,
  ) {
    const start = new Date(`${stockDate}T00:00:00`);
    const end = new Date(`${stockDate}T23:59:59.999`);

    const { data, error } = await this.supabase
      .from("waste_logs")
      .select("business_product_id, quantity, total_cost_minor, occurred_at")
      .eq("business_id", businessId)
      .eq("location_id", locationId)
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString());

    if (error) throw error;

    const map = new Map<string, WasteAggregateRow>();

    for (const row of data ?? []) {
      if (localDateKey(new Date(row.occurred_at)) !== stockDate) continue;
      const current = map.get(row.business_product_id) ?? {
        business_product_id: row.business_product_id,
        quantity: 0,
        total_cost_minor: 0,
      };
      current.quantity += Number(row.quantity);
      current.total_cost_minor += Number(row.total_cost_minor);
      map.set(row.business_product_id, current);
    }

    return new Map(
      [...map.entries()].map(([productId, aggregate]) => [
        productId,
        {
          quantity: Number(aggregate.quantity.toFixed(3)),
          totalCostMinor: aggregate.total_cost_minor,
        },
      ]),
    );
  }
}
