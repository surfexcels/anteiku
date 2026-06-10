import type {
  Recommendation,
  RecommendationStatus,
} from "@/src/modules/recommendations/domain/recommendation";

export interface RecommendationRepository {
  list(businessId: string): Promise<Recommendation[]>;
  updateStatus(
    businessId: string,
    recommendationId: string,
    status: RecommendationStatus,
  ): Promise<Recommendation>;
}
