import { z } from "zod";
import { createJsonCompletion } from "@/src/lib/openai/chat";
import { isOpenAIConfigured } from "@/src/lib/env";

const aiResponseSchema = z.object({
  title: z.string().min(8).max(120),
  explanation: z.string().min(40).max(600),
});

export interface RecommendationDraft {
  title: string;
  explanation: string;
  evidence: Record<string, unknown>;
  estimatedAnnualImpactMinor: number;
  currencyCode: string;
}

export async function enhanceRecommendationWithAi(
  draft: RecommendationDraft,
): Promise<RecommendationDraft> {
  if (!isOpenAIConfigured()) return draft;

  try {
    const parsed = await createJsonCompletion(
      [
        {
          role: "system",
          content:
            "You write practical waste-reduction advice for independent cafe owners in Europe. Be specific, calm, and actionable. Return JSON with title and explanation only.",
        },
        {
          role: "user",
          content: `Improve this insight for a cafe owner. Keep facts accurate and mention money where helpful.

Currency: ${draft.currencyCode}
Estimated annual saving (minor units): ${draft.estimatedAnnualImpactMinor}
Evidence: ${JSON.stringify(draft.evidence)}
Draft title: ${draft.title}
Draft explanation: ${draft.explanation}`,
        },
      ],
      (value) => aiResponseSchema.parse(value),
    );

    return {
      ...draft,
      title: parsed.title,
      explanation: parsed.explanation,
    };
  } catch {
    return draft;
  }
}
