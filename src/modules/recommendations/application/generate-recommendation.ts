import { enhanceRecommendationWithAi } from "@/src/modules/recommendations/application/enhance-recommendation-with-ai";
import type { RecommendationRepository } from "@/src/modules/recommendations/application/recommendation-repository";
import type { Recommendation } from "@/src/modules/recommendations/domain/recommendation";
import type { WasteRepository } from "@/src/modules/waste/application/waste-repository";

export interface GenerateRecommendationInput {
  businessId: string;
  locationId: string;
  currencyCode: string;
}

export async function generateRecommendation(
  wasteRepository: WasteRepository,
  recommendationRepository: RecommendationRepository,
  input: GenerateRecommendationInput,
): Promise<Recommendation> {
  const [summary, trend] = await Promise.all([
    wasteRepository.getSummary(input.businessId, input.locationId, 30),
    wasteRepository.getDailyTrend(input.businessId, input.locationId, 14),
  ]);

  if (summary.topProducts.length === 0) {
    throw new Error("INSUFFICIENT_DATA");
  }

  const top = summary.topProducts[0];
  const shareOfTotal =
    summary.totalCostMinor > 0
      ? top.totalCostMinor / summary.totalCostMinor
      : 0;

  const activeDays = trend.filter((day) => day.itemCount > 0).length;
  const weeklyCost = summary.totalCostMinor / Math.max(activeDays / 7, 1);
  const reductionRate = shareOfTotal > 0.35 ? 0.2 : 0.12;
  const annualImpact = Math.round(weeklyCost * 52 * reductionRate);

  const title =
    shareOfTotal > 0.35
      ? `Cut waste on ${top.productName}`
      : `Review ordering for ${top.productName}`;

  const explanation =
    shareOfTotal > 0.35
      ? `${top.productName} drove ${Math.round(shareOfTotal * 100)}% of waste cost in the last 30 days (${top.quantity} units logged). Tighten batch sizes and end-of-day planning for this item first.`
      : `${top.productName} is your top wasted product (${top.quantity} units in 30 days). Small production or ordering tweaks here should lower daily loss without hurting service.`;

  const evidence = {
    productName: top.productName,
    recentQuantity: top.quantity,
    recentCostMinor: top.totalCostMinor,
    shareOfTotal: Number(shareOfTotal.toFixed(2)),
    activeDays,
  };

  const draft = await enhanceRecommendationWithAi({
    title,
    explanation,
    evidence,
    estimatedAnnualImpactMinor: annualImpact,
    currencyCode: input.currencyCode,
  });

  return recommendationRepository.create({
    businessId: input.businessId,
    locationId: input.locationId,
    title: draft.title,
    explanation: draft.explanation,
    evidence,
    estimatedAnnualImpactMinor: annualImpact,
    currencyCode: input.currencyCode,
  });
}
