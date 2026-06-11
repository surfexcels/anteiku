import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { localDateKey, nextDateKey, previousDateKey } from "@/src/lib/date/local-date-key";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const url = new URL(request.url);
  const stockDate = url.searchParams.get("date") ?? localDateKey(new Date());

  try {
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const inventoryRepository = new SupabaseInventoryRepository(context.supabase);
    const wasteRepository = new SupabaseWasteRepository(context.supabase);

    const yesterdayDate = previousDateKey(stockDate);

    const [products, recentDays, day, priorDay, wasteLogs, wasteReasons] =
      await Promise.all([
        catalogRepository.listBusinessProducts(context.business.id),
        inventoryRepository.listRecentDays(
          context.business.id,
          context.location.id,
          21,
        ),
        inventoryRepository.getDayByDate(
          context.business.id,
          context.location.id,
          stockDate,
        ),
        inventoryRepository.getDayByDate(
          context.business.id,
          context.location.id,
          yesterdayDate,
        ),
        wasteRepository.listLogsForDate(context.business.id, stockDate),
        wasteRepository.listReasons(context.business.id),
      ]);

    const yesterdayClosed = recentDays.find(
      (item) => item.stockDate === yesterdayDate && item.status === "closed",
    );

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      stockDate,
      nextStockDate: nextDateKey(stockDate),
      products: products.filter((product) => product.isActive),
      recentDays,
      day,
      priorDay: priorDay?.status === "closed" ? priorDay : null,
      canCarryForward: Boolean(yesterdayClosed),
      wasteLogs,
      wasteReasons,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load inventory page" },
      { status: 500 },
    );
  }
}
