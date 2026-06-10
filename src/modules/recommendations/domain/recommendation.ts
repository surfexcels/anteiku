export type RecommendationStatus =
  | "new"
  | "reviewed"
  | "accepted"
  | "dismissed";

export interface Recommendation {
  id: string;
  title: string;
  explanation: string;
  estimatedAnnualImpactMinor: number;
  currencyCode: string;
  status: RecommendationStatus;
  generatedAt: string;
}
