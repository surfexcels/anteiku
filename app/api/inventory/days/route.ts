import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { openInventoryDaySchema } from "@/src/modules/inventory/application/inventory-schemas";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";

export async function POST(request: Request) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const body = await request.json();
  const parsed = openInventoryDaySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseInventoryRepository(context.supabase);
    const day = await repository.openDay({
      businessId: context.business.id,
      locationId: context.location.id,
      stockDate: parsed.data.stockDate,
      userId: context.userId,
      lines: parsed.data.lines,
      note: parsed.data.note,
      carryForward: parsed.data.carryForward,
    });

    return NextResponse.json({ day });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not open inventory day.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
