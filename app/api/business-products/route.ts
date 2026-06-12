import { NextResponse } from "next/server";
import { requireCapability } from "@/src/lib/auth/require-capability";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import {
  addBusinessProductSchema,
  moneyToMinorUnits,
} from "@/src/modules/catalog/application/catalog-schemas";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await requireCapability("manageCatalog");
  if ("error" in context) return context.error;

  const parsed = addBusinessProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseCatalogRepository(context.supabase);
    const product = await repository.addBusinessProduct({
      businessId: context.business.id,
      userId: context.userId,
      catalogSourceId: parsed.data.catalogSourceId,
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      unit: parsed.data.unit,
      unitCostMinor: moneyToMinorUnits(parsed.data.unitCost),
      currencyCode: context.business.currencyCode,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("duplicate")
        ? "This product is already in your menu"
        : "Could not add product";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
