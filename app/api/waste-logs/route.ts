import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { createWasteLogSchema } from "@/src/modules/waste/application/waste-schemas";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseWasteRepository(context.supabase);
    const logs = await repository.listLogs(context.business.id);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ error: "Could not load waste logs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const parsed = createWasteLogSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid waste log", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseWasteRepository(context.supabase);
    const log = await repository.createLog({
      businessId: context.business.id,
      locationId: context.location.id,
      userId: context.userId,
      businessProductId: parsed.data.businessProductId,
      wasteReasonId: parsed.data.wasteReasonId,
      quantity: parsed.data.quantity,
      note: parsed.data.note,
      occurredAt: parsed.data.occurredAt,
    });
    return NextResponse.json({ log }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create waste log" }, { status: 500 });
  }
}
