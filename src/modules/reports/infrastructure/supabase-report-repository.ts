import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateReportInput,
  ReportRepository,
} from "@/src/modules/reports/application/report-repository";
import type { Report, ReportSummary } from "@/src/modules/reports/domain/report";

interface ReportRow {
  id: string;
  period_start: string;
  period_end: string;
  summary: ReportSummary;
  created_at: string;
}

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export class SupabaseReportRepository implements ReportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async list(businessId: string): Promise<Report[]> {
    const { data, error } = await this.client
      .from("reports")
      .select("id, period_start, period_end, summary, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as ReportRow[]).map(mapReport);
  }

  async create(input: CreateReportInput): Promise<Report> {
    const start = `${input.periodStart}T00:00:00.000Z`;
    const end = `${input.periodEnd}T23:59:59.999Z`;

    const { data: logs, error: logsError } = await this.client
      .from("waste_logs")
      .select("total_cost_minor, business_products(name)")
      .eq("business_id", input.businessId)
      .gte("occurred_at", start)
      .lte("occurred_at", end);

    if (logsError) throw logsError;

    const rows = (logs ?? []) as unknown as Array<{
      total_cost_minor: number;
      business_products: { name: string } | { name: string }[] | null;
    }>;

    const byProduct = new Map<string, number>();
    let totalCostMinor = 0;

    for (const row of rows) {
      const related = row.business_products;
      const name = Array.isArray(related)
        ? related[0]?.name ?? "Unknown"
        : related?.name ?? "Unknown";
      totalCostMinor += row.total_cost_minor;
      byProduct.set(name, (byProduct.get(name) ?? 0) + row.total_cost_minor);
    }

    const summary: ReportSummary = {
      totalCostMinor,
      logCount: rows.length,
      topProducts: [...byProduct.entries()]
        .map(([productName, cost]) => ({ productName, totalCostMinor: cost }))
        .sort((left, right) => right.totalCostMinor - left.totalCostMinor)
        .slice(0, 10),
    };

    const { data, error } = await this.client
      .from("reports")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId ?? null,
        period_start: input.periodStart,
        period_end: input.periodEnd,
        summary,
        created_by: input.userId,
      })
      .select("id, period_start, period_end, summary, created_at")
      .single();

    if (error) throw error;
    return mapReport(data as ReportRow);
  }
}
