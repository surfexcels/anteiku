import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { generateRecommendation } from "@/src/modules/recommendations/application/generate-recommendation";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseRecommendationRepository(context.supabase);
    const recommendations = await repository.list(context.business.id);
    return NextResponse.json({ recommendations });
  } catch {
    return NextResponse.json(
      { error: "Could not load recommendations" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireCapability("manageCatalog");
  if ("error" in context) return context.error;

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const recommendationRepository = new SupabaseRecommendationRepository(
      context.supabase,
    );

    const recommendation = await generateRecommendation(
      wasteRepository,
      recommendationRepository,
      {
        businessId: context.business.id,
        locationId: context.location.id,
        currencyCode: context.business.currencyCode,
      },
    );

    return NextResponse.json({ recommendation }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_DATA") {
      return NextResponse.json(
        { error: "Log some waste before generating insights" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Could not generate recommendation" },
      { status: 500 },
    );
  }
}
