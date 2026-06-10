import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateWasteLogInput,
  WasteRepository,
} from "@/src/modules/waste/application/waste-repository";
import type {
  WasteLog,
  WasteReason,
  WasteSummary,
} from "@/src/modules/waste/domain/waste";

interface WasteReasonRow {
  id: string;
  code: string;
  label: string;
}

interface WasteLogRow {
  id: string;
  business_product_id: string;
  waste_reason_id: string | null;
  quantity: number;
  unit_cost_minor: number;
  total_cost_minor: number;
  currency_code: string;
  occurred_at: string;
  note: string | null;
  business_products: { name: string } | { name: string }[] | null;
  waste_reasons: { label: string } | { label: string }[] | null;
}

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

  async listLogs(businessId: string, limit = 50): Promise<WasteLog[]> {
    const { data, error } = await this.client
      .from("waste_logs")
      .select(
        "id, business_product_id, waste_reason_id, quantity, unit_cost_minor, total_cost_minor, currency_code, occurred_at, note, business_products(name), waste_reasons(label)",
      )
      .eq("business_id", businessId)
      .order("occurred_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return ((data ?? []) as unknown as WasteLogRow[]).map(mapWasteLog);
  }

  async createLog(input: CreateWasteLogInput): Promise<WasteLog> {
    const { data: product, error: productError } = await this.client
      .from("business_products")
      .select("id, name, unit_cost_minor, currency_code")
      .eq("business_id", input.businessId)
      .eq("id", input.businessProductId)
      .single();

    if (productError || !product) {
      throw new Error("Product not found");
    }

    const { data, error } = await this.client
      .from("waste_logs")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId,
        business_product_id: input.businessProductId,
        waste_reason_id: input.wasteReasonId ?? null,
        quantity: input.quantity,
        unit_cost_minor: product.unit_cost_minor,
        currency_code: product.currency_code,
        note: input.note ?? null,
        occurred_at: input.occurredAt ?? new Date().toISOString(),
        source: "manual",
        created_by: input.userId,
      })
      .select(
        "id, business_product_id, waste_reason_id, quantity, unit_cost_minor, total_cost_minor, currency_code, occurred_at, note, business_products(name), waste_reasons(label)",
      )
      .single();

    if (error) throw error;
    return mapWasteLog(data as unknown as WasteLogRow);
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
}

function mapWasteLog(row: WasteLogRow): WasteLog {
  return {
    id: row.id,
    businessProductId: row.business_product_id,
    productName: relationName(row.business_products) ?? "Unknown",
    wasteReasonId: row.waste_reason_id,
    wasteReasonLabel: relationLabel(row.waste_reasons),
    quantity: Number(row.quantity),
    unitCostMinor: row.unit_cost_minor,
    totalCostMinor: row.total_cost_minor,
    currencyCode: row.currency_code,
    occurredAt: row.occurred_at,
    note: row.note,
  };
}
