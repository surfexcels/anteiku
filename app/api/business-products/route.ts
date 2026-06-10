import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import {
  addBusinessProductSchema,
  moneyToMinorUnits,
} from "@/src/modules/catalog/application/catalog-schemas";
import { SupabaseBusinessRepository } from "@/src/modules/business/infrastructure/supabase-business-repository";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = addBusinessProductSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid product", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const businessRepository = new SupabaseBusinessRepository(supabase);
  const business = await businessRepository.getCurrentForUser(userId);
  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  try {
    const repository = new SupabaseCatalogRepository(supabase);
    const product = await repository.addBusinessProduct({
      businessId: business.id,
      userId,
      catalogSourceId: parsed.data.catalogSourceId,
      name: parsed.data.name,
      imageUrl: parsed.data.imageUrl,
      unit: parsed.data.unit,
      unitCostMinor: moneyToMinorUnits(parsed.data.unitCost),
      currencyCode: business.currencyCode,
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
