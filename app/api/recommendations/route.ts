import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
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

export async function POST() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const summary = await wasteRepository.getSummary(context.business.id, 30);

    if (summary.topProducts.length === 0) {
      return NextResponse.json(
        { error: "Log some waste before generating insights" },
        { status: 400 },
      );
    }

    const top = summary.topProducts[0];
    const weeklyCost = summary.totalCostMinor / 4;
    const annualImpact = Math.round(weeklyCost * 52 * 0.15);

    const { data, error } = await context.supabase
      .from("recommendations")
      .insert({
        business_id: context.business.id,
        location_id: context.location.id,
        title: `Reduce waste on ${top.productName}`,
        explanation: `${top.productName} accounts for a large share of your recent waste (${top.quantity} units logged). Review production quantities and ordering for this item.`,
        evidence: {
          productName: top.productName,
          recentQuantity: top.quantity,
          recentCostMinor: top.totalCostMinor,
        },
        estimated_annual_impact_minor: annualImpact,
        currency_code: context.business.currencyCode,
      })
      .select(
        "id, title, explanation, estimated_annual_impact_minor, currency_code, status, generated_at",
      )
      .single();

    if (error) throw error;

    return NextResponse.json(
      {
        recommendation: {
          id: data.id,
          title: data.title,
          explanation: data.explanation,
          estimatedAnnualImpactMinor: data.estimated_annual_impact_minor,
          currencyCode: data.currency_code,
          status: data.status,
          generatedAt: data.generated_at,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Could not generate recommendation" },
      { status: 500 },
    );
  }
}
