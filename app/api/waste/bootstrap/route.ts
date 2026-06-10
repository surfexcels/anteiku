import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const wasteRepository = new SupabaseWasteRepository(context.supabase);
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);

    const [logs, products, reasons] = await Promise.all([
      wasteRepository.listLogs(context.business.id),
      catalogRepository.listBusinessProducts(context.business.id),
      wasteRepository.listReasons(context.business.id),
    ]);

    return NextResponse.json({
      currencyCode: context.business.currencyCode,
      logs,
      products: products.filter((product) => product.isActive),
      reasons,
    });
  } catch {
    return NextResponse.json({ error: "Could not load waste page" }, { status: 500 });
  }
}
