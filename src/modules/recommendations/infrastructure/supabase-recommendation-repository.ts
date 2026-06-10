import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecommendationRepository } from "@/src/modules/recommendations/application/recommendation-repository";
import type {
  Recommendation,
  RecommendationStatus,
} from "@/src/modules/recommendations/domain/recommendation";

interface RecommendationRow {
  id: string;
  title: string;
  explanation: string;
  estimated_annual_impact_minor: number;
  currency_code: string;
  status: RecommendationStatus;
  generated_at: string;
}

function mapRecommendation(row: RecommendationRow): Recommendation {
  return {
    id: row.id,
    title: row.title,
    explanation: row.explanation,
    estimatedAnnualImpactMinor: row.estimated_annual_impact_minor,
    currencyCode: row.currency_code,
    status: row.status,
    generatedAt: row.generated_at,
  };
}

export class SupabaseRecommendationRepository
  implements RecommendationRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async list(businessId: string): Promise<Recommendation[]> {
    const { data, error } = await this.client
      .from("recommendations")
      .select(
        "id, title, explanation, estimated_annual_impact_minor, currency_code, status, generated_at",
      )
      .eq("business_id", businessId)
      .order("generated_at", { ascending: false });

    if (error) throw error;
    return ((data ?? []) as RecommendationRow[]).map(mapRecommendation);
  }

  async updateStatus(
    businessId: string,
    recommendationId: string,
    status: RecommendationStatus,
  ): Promise<Recommendation> {
    const { data, error } = await this.client
      .from("recommendations")
      .update({ status })
      .eq("business_id", businessId)
      .eq("id", recommendationId)
      .select(
        "id, title, explanation, estimated_annual_impact_minor, currency_code, status, generated_at",
      )
      .single();

    if (error) throw error;
    return mapRecommendation(data as RecommendationRow);
  }
}
