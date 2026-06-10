import { NextResponse } from "next/server";
import { getBusinessContext } from "@/src/lib/auth/get-business-context";
import { SupabaseSupplierImportRepository } from "@/src/modules/imports/infrastructure/supabase-import-repository";

export async function GET() {
  const context = await getBusinessContext();
  if ("error" in context) return context.error;

  try {
    const repository = new SupabaseSupplierImportRepository(context.supabase);
    const imports = await repository.list(context.business.id);

    return NextResponse.json({ imports });
  } catch {
    return NextResponse.json({ error: "Could not load imports" }, { status: 500 });
  }
}
