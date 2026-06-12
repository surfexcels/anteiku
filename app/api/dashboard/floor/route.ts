import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { localDateKey } from "@/src/lib/date/local-date-key";
import {
  canCloseInventoryDay,
  canLogWaste,
} from "@/src/modules/business/domain/permissions";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const stockDate = localDateKey(new Date());
  const role = context.business.role;

  try {
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    const inventoryRepository = new SupabaseInventoryRepository(context.supabase);
    const wasteRepository = new SupabaseWasteRepository(context.supabase);

    const [products, inventoryDay, wasteLogs] = await Promise.all([
      catalogRepository.listBusinessProducts(context.business.id),
      inventoryRepository.getDayByDate(
        context.business.id,
        context.location.id,
        stockDate,
      ),
      wasteRepository.listLogsForDate(
        context.business.id,
        stockDate,
        context.location.id,
      ),
    ]);

    const activeProducts = products
      .filter((product) => product.isActive)
      .sort((left, right) => left.name.localeCompare(right.name));

    const wasteByProduct = new Map<string, number>();
    for (const log of wasteLogs) {
      wasteByProduct.set(
        log.businessProductId,
        (wasteByProduct.get(log.businessProductId) ?? 0) + log.quantity,
      );
    }

    const totalCostMinor = wasteLogs.reduce(
      (sum, log) => sum + log.totalCostMinor,
      0,
    );

    const totalQuantity = wasteLogs.reduce((sum, log) => sum + log.quantity, 0);

    return NextResponse.json({
      stockDate,
      businessName: context.business.name,
      currencyCode: context.business.currencyCode,
      role,
      location: context.location,
      locations: context.locations,
      inventoryDay: inventoryDay
        ? {
            id: inventoryDay.id,
            status: inventoryDay.status,
            lineCount: inventoryDay.lines.length,
            productCount: activeProducts.length,
          }
        : null,
      wasteToday: {
        count: wasteLogs.length,
        totalQuantity,
        totalCostMinor,
        byProduct: Object.fromEntries(wasteByProduct),
      },
      recentLogs: wasteLogs.slice(0, 6).map((log) => ({
        id: log.id,
        productName: log.productName,
        quantity: log.quantity,
        totalCostMinor: log.totalCostMinor,
        occurredAt: log.occurredAt,
      })),
      products: activeProducts.map((product) => ({
        id: product.id,
        name: product.name,
        unit: product.unit,
        wastedToday: wasteByProduct.get(product.id) ?? 0,
      })),
      permissions: {
        canLogWaste: canLogWaste(role),
        canCloseStock: canCloseInventoryDay(role),
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not load floor mode" },
      { status: 500 },
    );
  }
}
