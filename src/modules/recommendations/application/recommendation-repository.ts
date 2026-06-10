import type {
  Recommendation,
  RecommendationStatus,
} from "@/src/modules/recommendations/domain/recommendation";

export interface CreateRecommendationInput {
  businessId: string;
  locationId: string;
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  estimatedAnnualImpactMinor: number;
  currencyCode: string;
}

export interface RecommendationRepository {
  list(businessId: string): Promise<Recommendation[]>;
  create(input: CreateRecommendationInput): Promise<Recommendation>;
  updateStatus(
    businessId: string,
    recommendationId: string,
    status: RecommendationStatus,
  ): Promise<Recommendation>;
}
