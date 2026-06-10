import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import {
  moneyToMinorUnits,
  updateBusinessProductSchema,
} from "@/src/modules/catalog/application/catalog-schemas";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { id } = await params;
  const parsed = updateBusinessProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid update", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseCatalogRepository(context.supabase);
    const product = await repository.updateBusinessProduct({
      businessId: context.business.id,
      productId: id,
      name: parsed.data.name,
      unit: parsed.data.unit,
      unitCostMinor:
        parsed.data.unitCost !== undefined
          ? moneyToMinorUnits(parsed.data.unitCost)
          : undefined,
      isActive: parsed.data.isActive,
      unitCo2eG: parsed.data.unitCo2eG,
      co2eSource: parsed.data.co2eSource,
      co2eMethodology: parsed.data.co2eMethodology,
    });

    await invalidateBusinessDashboardCache(context.business.id);
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ error: "Could not update product" }, { status: 500 });
  }
}
