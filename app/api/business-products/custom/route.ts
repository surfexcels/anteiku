import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import {
  addCustomBusinessProductSchema,
  moneyToMinorUnits,
} from "@/src/modules/catalog/application/catalog-schemas";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireCapability("manageCatalog");
  if ("error" in context) return context.error;

  const parsed = addCustomBusinessProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseCatalogRepository(context.supabase);
    const product = await repository.addCustomBusinessProduct({
      businessId: context.business.id,
      locationId: context.location.id,
      userId: context.userId,
      name: parsed.data.name,
      unit: parsed.data.unit,
      unitCostMinor: moneyToMinorUnits(parsed.data.unitCost),
      currencyCode: context.business.currencyCode,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not add product" }, { status: 500 });
  }
}
