import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseRecommendationRepository(context.supabase);
    const recommendations = await repository.list(
      context.business.id,
      context.location.id,
    );

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      recommendations,
    });
  } catch {
    return NextResponse.json({ error: "Could not load insights" }, { status: 500 });
  }
}
