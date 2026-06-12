import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { verifyMutationRequest } from "@/src/lib/auth/verify-api-request";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import { batchWasteLogSchema } from "@/src/modules/waste/application/waste-schemas";
import { SupabaseCatalogRepository } from "@/src/modules/catalog/infrastructure/supabase-catalog-repository";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function POST(request: Request) {
  const blocked = verifyMutationRequest(request);
  if (blocked) return blocked;

  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const parsed = batchWasteLogSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid batch log", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const catalogRepository = new SupabaseCatalogRepository(context.supabase);
    for (const entry of parsed.data.entries) {
      const allowed = await catalogRepository.isProductAtLocation(
        context.business.id,
        context.location.id,
        entry.businessProductId,
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "One or more products are not on your active site menu" },
          { status: 400 },
        );
      }
    }

    const repository = new SupabaseWasteRepository(context.supabase);
    const logs = await repository.createLogsBatch({
      businessId: context.business.id,
      locationId: context.location.id,
      userId: context.userId,
      wasteReasonId: parsed.data.wasteReasonId,
      note: parsed.data.note,
      entries: parsed.data.entries,
    });

    await invalidateBusinessDashboardCache(context.business.id);

    const totalCostMinor = logs.reduce((sum, log) => sum + log.totalCostMinor, 0);
    return NextResponse.json(
      {
        logs,
        summary: {
          count: logs.length,
          totalCostMinor,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Could not save waste logs" }, { status: 500 });
  }
}
