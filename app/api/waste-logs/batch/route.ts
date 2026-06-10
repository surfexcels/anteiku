import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { invalidateBusinessDashboardCache } from "@/src/lib/cache/invalidate-business-dashboard-cache";
import { batchWasteLogSchema } from "@/src/modules/waste/application/waste-schemas";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function POST(request: Request) {
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
