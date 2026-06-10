import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { readServerCache, writeServerCache } from "@/src/lib/cache/server-cache";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { buildEmpCoReadiness } from "@/src/modules/sustainability/application/build-empco-readiness";
import { carbonEquivalencies } from "@/src/modules/sustainability/application/carbon-equivalencies";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

const CACHE_TTL_SECONDS = 120;

const settingsSchema = z.object({
  carbonDisclosureEnabled: z.boolean(),
});

function parseDays(value: string | null) {
  const parsed = Number(value ?? "7");
  return parsed === 30 ? 30 : 7;
}

export async function GET(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { searchParams } = new URL(request.url);
  const days = parseDays(searchParams.get("days"));
  const cacheKey = `sustainability:${context.business.id}:${days}`;

  const cached = await readServerCache<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);

    const [analytics, products] = await Promise.all([
      wasteRepository.getOverviewAnalytics(context.business.id, days),
      catalogRepository.listBusinessProducts(context.business.id),
    ]);

    const empco = buildEmpCoReadiness(
      products,
      context.business.carbonDisclosureEnabled,
    );

    const payload = {
      businessName: context.business.name,
      countryCode: context.business.countryCode,
      currencyCode: context.business.currencyCode,
      periodDays: days,
      carbon: analytics.carbon,
      equivalencies: carbonEquivalencies(analytics.carbon.summary.totalCo2eG),
      empco,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.unit,
        unitCo2eG: product.unitCo2eG,
        co2eSource: product.co2eSource,
        co2eMethodology: product.co2eMethodology,
        isActive: product.isActive,
      })),
    };

    await writeServerCache(cacheKey, payload, CACHE_TTL_SECONDS);

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch {
    return NextResponse.json({ error: "Could not load sustainability data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  }

  try {
    const businessRepository = new SupabaseBusinessRepository(context.supabase);
    await businessRepository.updateCarbonDisclosure(
      context.business.id,
      parsed.data.carbonDisclosureEnabled,
    );
    await invalidateBusinessDashboardCache(context.business.id);

    return NextResponse.json({
      carbonDisclosureEnabled: parsed.data.carbonDisclosureEnabled,
    });
  } catch {
    return NextResponse.json({ error: "Could not update settings" }, { status: 500 });
  }
}
