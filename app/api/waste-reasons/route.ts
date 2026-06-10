import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseWasteRepository } from "@/src/modules/waste/infrastructure/supabase-waste-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseWasteRepository(context.supabase);
    const reasons = await repository.listReasons(context.business.id);
    return NextResponse.json({ reasons });
  } catch {
    return NextResponse.json({ error: "Could not load reasons" }, { status: 500 });
  }
}
