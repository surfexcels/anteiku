import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateBatchWasteLogsInput,
  CreateWasteLogInput,
  WasteLogRecord,
  WasteRepository,
} from "@/src/modules/waste/application/waste-repository";
import {
  buildLocalDateRange,
  localDateKey,
  startOfLocalDay,
} from "@/src/lib/date/local-date-key";
import type { ProductUnit } from "@/src/modules/catalog/domain/catalog-product";
import type { Co2eSource } from "@/src/modules/sustainability/domain/carbon";
import { resolveLogUnitCo2eG } from "@/src/modules/sustainability/application/resolve-log-co2e";
import type {
  DailyWasteTrend,
  OverviewAnalytics,
  WasteLog,
  WastePeriodComparison,
  WasteReason,
  WasteReasonBreakdown,
  WasteSummary,
} from "@/src/modules/waste/domain/waste";

interface WasteReasonRow {
  id: string;
  code: string;
  label: string;
}

interface WasteProductRelation {
  name: string;
  sku: string | null;
  unit: ProductUnit;
  unit_co2e_g: number | null;
  co2e_source: Co2eSource | null;
  co2e_methodology: string | null;
}

interface WasteLogRow {
  id: string;
  business_product_id: string;
  location_id: string;
  created_by: string;
  waste_reason_id: string | null;
  quantity: number;
  unit_cost_minor: number;
  total_cost_minor: number;
  unit_co2e_g: number | null;
  total_co2e_g: number | null;
  currency_code: string;
  occurred_at: string;
  note: string | null;
  business_products: WasteProductRelation | WasteProductRelation[] | null;
  waste_reasons: { label: string } | { label: string }[] | null;
}

const WASTE_LOG_SELECT =
  "id, business_product_id, location_id, created_by, waste_reason_id, quantity, unit_cost_minor, total_cost_minor, unit_co2e_g, total_co2e_g, currency_code, occurred_at, note, business_products(name, sku, unit, unit_co2e_g, co2e_source, co2e_methodology), waste_reasons(label)";

const PRODUCT_SNAPSHOT_SELECT =
  "id, name, unit_cost_minor, currency_code, sku, unit, unit_co2e_g, co2e_source, co2e_methodology";

function relationName<T extends { name: string }>(
  value: T | T[] | null | undefined,
) {
  if (!value) return null;
  return Array.isArray(value) ? value[0]?.name ?? null : value.name;
}

function relationLabel<T extends { label: string }>(
  value: T | T[] | null | undefined,
) {
  if (!value) return null;
  return Array.isArray(value) ? value[0]?.label ?? null : value.label;
}

function relationProduct(
  value: WasteProductRelation | WasteProductRelation[] | null | undefined,
) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function co2eForLogRow(row: {
  quantity: number;
  unit_co2e_g?: number | null;
  business_products: WasteProductRelation | WasteProductRelation[] | null;
}) {
  const product = relationProduct(row.business_products);
  const unitCo2eG = resolveLogUnitCo2eG({
    loggedUnitCo2eG: row.unit_co2e_g,
    productUnitCo2eG: product?.unit_co2e_g,
    catalogSourceId: product?.sku,
    unit: product?.unit ?? "item",
    co2eSource: product?.co2e_source,
    co2eMethodology: product?.co2e_methodology,
  });
  return Number((Number(row.quantity) * unitCo2eG).toFixed(3));
}

export class SupabaseWasteRepository implements WasteRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listReasons(businessId: string): Promise<WasteReason[]> {
    const { data, error } = await this.client
      .from("waste_reasons")
      .select("id, code, label")
      .or(`business_id.is.null,business_id.eq.${businessId}`)
      .eq("is_active", true)
      .order("label");

    if (error) throw error;
    return ((data ?? []) as WasteReasonRow[]).map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
    }));
  }

  async listLogsForExport(businessId: string, days: number): Promise<WasteLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.client
      .from("waste_logs")
      .select(WASTE_LOG_SELECT)
      .eq("business_id", businessId)
      .gte("occurred_at", since.toISOString())
      .order("occurred_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as unknown as WasteLogRow[]).map(mapWasteLog);
  }

  async listLogs(businessId: string, limit = 50): Promise<WasteLog[]> {
    const { data, error } = await this.client
      .from("waste_logs")
      .select(WASTE_LOG_SELECT)
      .eq("business_id", businessId)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data ?? []) as unknown as WasteLogRow[]).map(mapWasteLog);
  }

  async listLogsForDate(
    businessId: string,
    stockDate: string,
    locationId?: string,
  ): Promise<WasteLog[]> {
    const start = new Date(`${stockDate}T00:00:00`);
    const end = new Date(`${stockDate}T23:59:59.999`);

    let query = this.client
      .from("waste_logs")
      .select(WASTE_LOG_SELECT)
      .eq("business_id", businessId)
      .gte("occurred_at", start.toISOString())
      .lte("occurred_at", end.toISOString())
      .order("occurred_at", { ascending: false });

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return ((data ?? []) as unknown as WasteLogRow[])
      .filter((row) => localDateKey(new Date(row.occurred_at)) === stockDate)
      .map(mapWasteLog);
  }

  async getLog(businessId: string, logId: string): Promise<WasteLogRecord | null> {
    const { data, error } = await this.client
      .from("waste_logs")
      .select(WASTE_LOG_SELECT)
      .eq("business_id", businessId)
      .eq("id", logId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return mapWasteLogRecord(data as unknown as WasteLogRow);
  }

  async deleteLog(businessId: string, logId: string): Promise<void> {
    const { error } = await this.client
      .from("waste_logs")
      .delete()
      .eq("business_id", businessId)
      .eq("id", logId);

    if (error) throw error;
  }

  async createLog(input: CreateWasteLogInput): Promise<WasteLog> {
    const { data: product, error: productError } = await this.client
      .from("business_products")
      .select(PRODUCT_SNAPSHOT_SELECT)
      .eq("business_id", input.businessId)
      .eq("id", input.businessProductId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    const unitCo2eG = resolveLogUnitCo2eG({
      productUnitCo2eG: product.unit_co2e_g,
      catalogSourceId: product.sku,
      unit: product.unit,
      co2eSource: product.co2e_source,
      co2eMethodology: product.co2e_methodology,
    });

    const { data, error } = await this.client
      .from("waste_logs")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId,
        business_product_id: input.businessProductId,
        waste_reason_id: input.wasteReasonId ?? null,
        quantity: input.quantity,
        unit_cost_minor: product.unit_cost_minor,
        unit_co2e_g: unitCo2eG,
        currency_code: product.currency_code,
        note: input.note ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        source: input.source ?? "manual",
        created_by: input.userId,
      })
      .select(WASTE_LOG_SELECT)
      .single();

    if (error) throw error;
    return mapWasteLog(data as unknown as WasteLogRow);
  }

  async createLogsBatch(input: CreateBatchWasteLogsInput): Promise<WasteLog[]> {
    if (input.entries.length === 0) return [];

    const productIds = [...new Set(input.entries.map((entry) => entry.businessProductId))];
    const { data: products, error: productsError } = await this.client
      .from("business_products")
      .select(PRODUCT_SNAPSHOT_SELECT)
      .eq("business_id", input.businessId)
      .in("id", productIds);

    if (productsError || !products?.length) {
      throw new Error("Products not found");
    }

    const productById = new Map(
      products.map((product) => [product.id, product]),
    );

    const rows = input.entries.map((entry) => {
      const product = productById.get(entry.businessProductId);
      if (!product) throw new Error("Product not found");

      const unitCo2eG = resolveLogUnitCo2eG({
        productUnitCo2eG: product.unit_co2e_g,
        catalogSourceId: product.sku,
        unit: product.unit,
        co2eSource: product.co2e_source,
        co2eMethodology: product.co2e_methodology,
      });

      return {
        business_id: input.businessId,
        location_id: input.locationId,
        business_product_id: entry.businessProductId,
        waste_reason_id: input.wasteReasonId ?? null,
        quantity: entry.quantity,
        unit_cost_minor: product.unit_cost_minor,
        unit_co2e_g: unitCo2eG,
        currency_code: product.currency_code,
        note: entry.note ?? input.note ?? null,
        occurred_at: entry.occurredAt ?? new Date().toISOString(),
        source: input.source ?? "manual",
        created_by: input.userId,
      };
    });

    const { data, error } = await this.client
      .from("waste_logs")
      .insert(rows)
      .select(WASTE_LOG_SELECT);

    if (error) throw error;
    return ((data ?? []) as unknown as WasteLogRow[]).map(mapWasteLog);
  }

  async getSummary(businessId: string, days = 7): Promise<WasteSummary> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.client
      .from("waste_logs")
      .select(
        "quantity, total_cost_minor, business_products(name)",
      )
      .eq("business_id", businessId)
      .gte("occurred_at", since.toISOString());

    if (error) throw error;

    const rows = (data ?? []) as unknown as Array<{
      quantity: number;
      total_cost_minor: number;
      business_products: { name: string } | { name: string }[] | null;
    }>;

    const byProduct = new Map<string, { totalCostMinor: number; quantity: number }>();
    let totalCostMinor = 0;
    let itemCount = 0;

    for (const row of rows) {
      const productName = relationName(row.business_products) ?? "Unknown";
      totalCostMinor += row.total_cost_minor;
      itemCount += 1;

      const current = byProduct.get(productName) ?? {
        totalCostMinor: 0,
        quantity: 0,
      };
      current.totalCostMinor += row.total_cost_minor;
      current.quantity += Number(row.quantity);
      byProduct.set(productName, current);
    }

    const topProducts = [...byProduct.entries()]
      .map(([productName, stats]) => ({ productName, ...stats }))
      .sort((left, right) => right.totalCostMinor - left.totalCostMinor)
      .slice(0, 5);

    return { totalCostMinor, itemCount, topProducts };
  }

  async getDailyTrend(businessId: string, days = 7): Promise<DailyWasteTrend[]> {
    const periodStart = startOfLocalDay(days - 1);

    const { data, error } = await this.client
      .from("waste_logs")
      .select("total_cost_minor, occurred_at")
      .eq("business_id", businessId)
      .gte("occurred_at", periodStart.toISOString());

    if (error) throw error;

    const byDate = new Map<string, { totalCostMinor: number; itemCount: number }>();
    for (const date of buildLocalDateRange(days)) {
      byDate.set(date, { totalCostMinor: 0, itemCount: 0 });
    }

    for (const row of data ?? []) {
      const date = localDateKey(new Date(String(row.occurred_at)));
      const current = byDate.get(date);
      if (!current) continue;
      current.totalCostMinor += row.total_cost_minor;
      current.itemCount += 1;
    }

    return [...byDate.entries()].map(([date, stats]) => ({
      date,
      ...stats,
    }));
  }

  async getReasonBreakdown(
    businessId: string,
    days = 7,
  ): Promise<WasteReasonBreakdown[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await this.client
      .from("waste_logs")
      .select("total_cost_minor, waste_reasons(label)")
      .eq("business_id", businessId)
      .gte("occurred_at", since.toISOString());

    if (error) throw error;

    const byReason = new Map<string, { totalCostMinor: number; itemCount: number }>();

    for (const row of data ?? []) {
      const related = (row as { waste_reasons: { label: string } | { label: string }[] | null })
        .waste_reasons;
      const reasonLabel = relationLabel(related) ?? "Unspecified";
      const current = byReason.get(reasonLabel) ?? {
        totalCostMinor: 0,
        itemCount: 0,
      };
      current.totalCostMinor += (row as { total_cost_minor: number }).total_cost_minor;
      current.itemCount += 1;
      byReason.set(reasonLabel, current);
    }

    return [...byReason.entries()]
      .map(([reasonLabel, stats]) => ({ reasonLabel, ...stats }))
      .sort((left, right) => right.totalCostMinor - left.totalCostMinor);
  }

  async getPeriodComparison(
    businessId: string,
    days = 7,
  ): Promise<WastePeriodComparison> {
    const currentSince = new Date();
    currentSince.setDate(currentSince.getDate() - days);

    const previousSince = new Date(currentSince);
    previousSince.setDate(previousSince.getDate() - days);

    const { data, error } = await this.client
      .from("waste_logs")
      .select("total_cost_minor, occurred_at")
      .eq("business_id", businessId)
      .gte("occurred_at", previousSince.toISOString());

    if (error) throw error;

    let currentTotalCostMinor = 0;
    let previousTotalCostMinor = 0;

    for (const row of data ?? []) {
      const occurredAt = new Date(String(row.occurred_at));
      if (occurredAt >= currentSince) {
        currentTotalCostMinor += row.total_cost_minor;
      } else {
        previousTotalCostMinor += row.total_cost_minor;
      }
    }

    const changePercent =
      previousTotalCostMinor > 0
        ? Number(
            (
              ((currentTotalCostMinor - previousTotalCostMinor) /
                previousTotalCostMinor) *
              100
            ).toFixed(1),
          )
        : null;

    return {
      currentTotalCostMinor,
      previousTotalCostMinor,
      changePercent,
    };
  }

  async getOverviewAnalytics(
    businessId: string,
    days = 7,
  ): Promise<OverviewAnalytics> {
    const periodStart = startOfLocalDay(days - 1);
    const currentSince = periodStart;

    const fetchSince = new Date(periodStart);
    fetchSince.setDate(fetchSince.getDate() - days);

    const { data, error } = await this.client
      .from("waste_logs")
      .select(
        "quantity, total_cost_minor, unit_co2e_g, occurred_at, business_products(name, sku, unit, unit_co2e_g, co2e_source, co2e_methodology), waste_reasons(label)",
      )
      .eq("business_id", businessId)
      .gte("occurred_at", fetchSince.toISOString());

    if (error) throw error;

    type Row = {
      quantity: number;
      total_cost_minor: number;
      unit_co2e_g: number | null;
      occurred_at: string;
      business_products: WasteProductRelation | WasteProductRelation[] | null;
      waste_reasons: { label: string } | { label: string }[] | null;
    };

    const rows = (data ?? []) as unknown as Row[];

    const byProduct = new Map<string, { totalCostMinor: number; quantity: number }>();
    const byProductCo2 = new Map<string, { totalCo2eG: number; quantity: number }>();
    const byReason = new Map<string, { totalCostMinor: number; itemCount: number }>();
    const byDate = new Map<string, { totalCostMinor: number; itemCount: number }>();
    const byDateCo2 = new Map<string, { totalCo2eG: number; itemCount: number }>();

    for (const key of buildLocalDateRange(days)) {
      byDate.set(key, { totalCostMinor: 0, itemCount: 0 });
      byDateCo2.set(key, { totalCo2eG: 0, itemCount: 0 });
    }

    let currentTotalCostMinor = 0;
    let previousTotalCostMinor = 0;
    let currentTotalCo2eG = 0;
    let previousTotalCo2eG = 0;
    let itemCount = 0;

    for (const row of rows) {
      const occurredAt = new Date(String(row.occurred_at));
      const inCurrent = occurredAt >= currentSince;
      const rowCo2eG = co2eForLogRow(row);

      if (inCurrent) {
        currentTotalCostMinor += row.total_cost_minor;
        currentTotalCo2eG += rowCo2eG;
        itemCount += 1;

        const productName = relationName(row.business_products) ?? "Unknown";
        const productStats = byProduct.get(productName) ?? {
          totalCostMinor: 0,
          quantity: 0,
        };
        productStats.totalCostMinor += row.total_cost_minor;
        productStats.quantity += Number(row.quantity);
        byProduct.set(productName, productStats);

        const productCo2Stats = byProductCo2.get(productName) ?? {
          totalCo2eG: 0,
          quantity: 0,
        };
        productCo2Stats.totalCo2eG += rowCo2eG;
        productCo2Stats.quantity += Number(row.quantity);
        byProductCo2.set(productName, productCo2Stats);

        const reasonLabel = relationLabel(row.waste_reasons) ?? "Unspecified";
        const reasonStats = byReason.get(reasonLabel) ?? {
          totalCostMinor: 0,
          itemCount: 0,
        };
        reasonStats.totalCostMinor += row.total_cost_minor;
        reasonStats.itemCount += 1;
        byReason.set(reasonLabel, reasonStats);

        const date = localDateKey(occurredAt);
        const dayStats = byDate.get(date);
        if (dayStats) {
          dayStats.totalCostMinor += row.total_cost_minor;
          dayStats.itemCount += 1;
        }
        const dayCo2Stats = byDateCo2.get(date);
        if (dayCo2Stats) {
          dayCo2Stats.totalCo2eG += rowCo2eG;
          dayCo2Stats.itemCount += 1;
        }
      } else {
        previousTotalCostMinor += row.total_cost_minor;
        previousTotalCo2eG += rowCo2eG;
      }
    }

    const changePercent =
      previousTotalCostMinor > 0
        ? Number(
            (
              ((currentTotalCostMinor - previousTotalCostMinor) /
                previousTotalCostMinor) *
              100
            ).toFixed(1),
          )
        : null;

    const carbonChangePercent =
      previousTotalCo2eG > 0
        ? Number(
            (
              ((currentTotalCo2eG - previousTotalCo2eG) / previousTotalCo2eG) *
              100
            ).toFixed(1),
          )
        : null;

    const topProducts = [...byProduct.entries()]
      .map(([productName, stats]) => ({ productName, ...stats }))
      .sort((left, right) => right.totalCostMinor - left.totalCostMinor)
      .slice(0, 5);

    const topCarbonProducts = [...byProductCo2.entries()]
      .map(([productName, stats]) => ({ productName, ...stats }))
      .sort((left, right) => right.totalCo2eG - left.totalCo2eG)
      .slice(0, 5);

    return {
      summary: { totalCostMinor: currentTotalCostMinor, itemCount, topProducts },
      trend: [...byDate.entries()].map(([date, stats]) => ({ date, ...stats })),
      comparison: {
        currentTotalCostMinor,
        previousTotalCostMinor,
        changePercent,
      },
      reasonBreakdown: [...byReason.entries()]
        .map(([reasonLabel, stats]) => ({ reasonLabel, ...stats }))
        .sort((left, right) => right.totalCostMinor - left.totalCostMinor),
      carbon: {
        summary: {
          totalCo2eG: Number(currentTotalCo2eG.toFixed(3)),
          itemCount,
          topProducts: topCarbonProducts,
        },
        trend: [...byDateCo2.entries()].map(([date, stats]) => ({ date, ...stats })),
        comparison: {
          currentTotalCo2eG: Number(currentTotalCo2eG.toFixed(3)),
          previousTotalCo2eG: Number(previousTotalCo2eG.toFixed(3)),
          changePercent: carbonChangePercent,
        },
      },
    };
  }
}

function mapWasteLog(row: WasteLogRow): WasteLog {
  return mapWasteLogRecord(row);
}

function mapWasteLogRecord(row: WasteLogRow): WasteLogRecord {
  const totalCo2eG =
    row.total_co2e_g ??
    co2eForLogRow({
      quantity: row.quantity,
      unit_co2e_g: row.unit_co2e_g,
      business_products: row.business_products,
    });

  return {
    id: row.id,
    businessProductId: row.business_product_id,
    productName: relationName(row.business_products) ?? "Unknown",
    wasteReasonId: row.waste_reason_id,
    wasteReasonLabel: relationLabel(row.waste_reasons),
    quantity: Number(row.quantity),
    unitCostMinor: row.unit_cost_minor,
    totalCostMinor: row.total_cost_minor,
    unitCo2eG: row.unit_co2e_g,
    totalCo2eG,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    note: row.note,
    createdBy: row.created_by,
    locationId: row.location_id,
  };
}
