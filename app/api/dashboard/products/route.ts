import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseCatalogRepository(context.supabase);
    const products = await repository.listBusinessProducts(context.business.id);

    return NextResponse.json({
      countryCode: context.business.countryCode,
      currencyCode: context.business.currencyCode,
      products,
    });
  } catch {
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }
}
