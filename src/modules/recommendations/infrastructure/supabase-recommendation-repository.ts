import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreateRecommendationInput,
  RecommendationRepository,
} from "@/src/modules/recommendations/application/recommendation-repository";
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

  async create(input: CreateRecommendationInput): Promise<Recommendation> {
    const { data, error } = await this.client
      .from("recommendations")
      .insert({
        business_id: input.businessId,
        location_id: input.locationId,
        title: input.title,
        explanation: input.explanation,
        evidence: input.evidence,
        estimated_annual_impact_minor: input.estimatedAnnualImpactMinor,
        currency_code: input.currencyCode,
      })
      .select(
        "id, title, explanation, estimated_annual_impact_minor, currency_code, status, generated_at",
      )
      .single();

    if (error) throw error;
    return mapRecommendation(data as RecommendationRow);
  }

  async list(
    businessId: string,
    locationId?: string,
  ): Promise<Recommendation[]> {
    let query = this.client
      .from("recommendations")
      .select(
        "id, title, explanation, estimated_annual_impact_minor, currency_code, status, generated_at",
      )
      .eq("business_id", businessId);

    if (locationId) {
      query = query.eq("location_id", locationId);
    }

    const { data, error } = await query.order("generated_at", {
      ascending: false,
    });

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
