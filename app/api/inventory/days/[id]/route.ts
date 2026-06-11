import { NextResponse } from "next/server";
import { z } from "zod";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import {
  closeInventoryDaySchema,
  updateOpeningSchema,
} from "@/src/modules/inventory/application/inventory-schemas";
import { SupabaseInventoryRepository } from "@/src/modules/inventory/infrastructure/supabase-inventory-repository";

const patchSchema = z.union([
  updateOpeningSchema.extend({ action: z.literal("opening") }),
  closeInventoryDaySchema.extend({ action: z.literal("close") }),
]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { id } = await params;

  try {
    const repository = new SupabaseInventoryRepository(context.supabase);
    const day = await repository.getDayById(context.business.id, id);

    if (!day) {
      return NextResponse.json({ error: "Inventory day not found" }, { status: 404 });
    }

    return NextResponse.json({ day });
  } catch {
    return NextResponse.json(
      { error: "Could not load inventory day" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const repository = new SupabaseInventoryRepository(context.supabase);

    const day =
      parsed.data.action === "close"
        ? await repository.closeDay({
            businessId: context.business.id,
            dayId: id,
            userId: context.userId,
            lines: parsed.data.lines,
            note: parsed.data.note,
          })
        : await repository.updateOpening({
            businessId: context.business.id,
            dayId: id,
            userId: context.userId,
            lines: parsed.data.lines,
            note: parsed.data.note,
          });

    return NextResponse.json({ day });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not update inventory day.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
