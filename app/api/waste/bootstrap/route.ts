import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { localDateKey } from "@/src/lib/date/local-date-key";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const inventoryRepository = new SupabaseInventoryRepository(context.supabase);
    const today = localDateKey(new Date());

    const [
      logs,
      products,
      reasons,
      summary,
      trend,
      reasonBreakdown,
      comparison,
      inventoryDay,
    ] = await Promise.all([
      wasteRepository.listLogs(context.business.id, context.location.id, 100),
      catalogRepository.listBusinessProductsForLocation(
        context.business.id,
        context.location.id,
      ),
      wasteRepository.listReasons(context.business.id),
      wasteRepository.getSummary(context.business.id, context.location.id, 7),
      wasteRepository.getDailyTrend(context.business.id, context.location.id, 7),
      wasteRepository.getReasonBreakdown(
        context.business.id,
        context.location.id,
        7,
      ),
      wasteRepository.getPeriodComparison(
        context.business.id,
        context.location.id,
        7,
      ),
      inventoryRepository.getDayByDate(
        context.business.id,
        context.location.id,
        today,
      ),
    ]);

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      stockDate: today,
      logs,
      products,
      locationName: context.location.name,
      reasons,
      summary,
      trend,
      reasonBreakdown,
      comparison,
      inventoryDayStatus: inventoryDay?.status ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Could not load waste page" }, { status: 500 });
  }
}
