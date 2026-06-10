import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { readServerCache, writeServerCache } from "@/src/lib/cache/server-cache";
import { buildPriceMovers } from "@/src/modules/imports/application/build-price-movers";
import { SupabaseSupplierImportRepository } from "@/src/modules/imports/infrastructure/supabase-import-repository";
import { buildBudgetPacing } from "@/src/modules/overview/application/build-budget-pacing";
import { buildOverviewAlerts } from "@/src/modules/overview/application/build-overview-alerts";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseRecommendationRepository } from "@/src/modules/recommendations/infrastructure/supabase-recommendation-repository";
import { carbonEquivalencies } from "@/src/modules/sustainability/application/carbon-equivalencies";
import { calculateSavingsOpportunity } from "@/src/modules/waste/application/calculate-savings-opportunity";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

const CACHE_TTL_SECONDS = 120;

function parseDays(value: string | null) {
  const parsed = Number(value ?? "7");
  return parsed === 30 ? 30 : 7;
}

export async function GET(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get("days"));
  const cacheKey = `overview:${context.business.id}:${days}`;

  const cached = await readServerCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const recommendationRepository = new SupabaseRecommendationRepository(
      context.supabase,
    );
    const importRepository = new SupabaseSupplierImportRepository(context.supabase);

    const [analytics, products, recommendations, imports] = await Promise.all([
      wasteRepository.getOverviewAnalytics(context.business.id, days),
      catalogRepository.listBusinessProducts(context.business.id),
      recommendationRepository.list(context.business.id),
      importRepository.list(context.business.id),
    ]);

    const savings = calculateSavingsOpportunity(analytics.summary.totalCostMinor, days);
    const newInsights = recommendations.filter((item) => item.status === "new").length;
    const priceMovers = buildPriceMovers(imports);
    const budgetPacing = buildBudgetPacing(analytics.comparison, days);
    const alerts = buildOverviewAlerts({
      comparison: analytics.comparison,
      newInsights,
      recommendations,
      imports,
      priceMovers,
      periodDays: days,
    });

    const dailyAverageMinor =
      days > 0 ? Math.round(analytics.summary.totalCostMinor / days) : 0;
    const avgPerEntryMinor =
      analytics.summary.itemCount > 0
        ? Math.round(analytics.summary.totalCostMinor / analytics.summary.itemCount)
        : 0;

    const payload = {
      businessName: context.business.name,
      currencyCode: context.business.currencyCode,
      periodDays: days,
      summary: analytics.summary,
      trend: analytics.trend,
      comparison: analytics.comparison,
      reasonBreakdown: analytics.reasonBreakdown,
      carbon: analytics.carbon,
      carbonEquivalencies: carbonEquivalencies(analytics.carbon.summary.totalCo2eG),
      productCount: products.length,
      newInsights,
      savings,
      alerts,
      budgetPacing,
      priceMovers,
      dailyAverageMinor,
      avgPerEntryMinor,
    };

    await writeServerCache(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load overview" }, { status: 500 });
  }
}

