import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { localDateKey } from "@/src/lib/date/local-date-key";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";

export async function GET(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const url = new URL(request.url);
  const stockDate = url.searchParams.get("date") ?? localDateKey(new Date());

  try {
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const inventoryRepository = new SupabaseInventoryRepository(context.supabase);

    const [products, recentDays, day] = await Promise.all([
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
    ]);

    const yesterday = new Date(`${stockDate}T12:00:00`);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = localDateKey(yesterday);
    const yesterdayClosed = recentDays.find(
      (item) => item.stockDate === yesterdayDate && item.status === "closed",
    );

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      stockDate,
      products: products.filter((product) => product.isActive),
      recentDays,
      day,
      canCarryForward: Boolean(yesterdayClosed),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load inventory page" },
      { status: 500 },
    );
  }
}
